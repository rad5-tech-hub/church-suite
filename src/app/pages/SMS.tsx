import { useState, useEffect, useCallback, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { BibleLoader } from '../components/BibleLoader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { MessageSquare, Send, Inbox, Search, Users, UserPlus, Briefcase, X, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChurch } from '../context/ChurchContext';
import { useToast } from '../context/ToastContext';
import { fetchSMSWallet, createOrFundWallet, fetchMembers, fetchNewcomers, fetchWorkforce, sendSms } from '../api';
import { SMSWallet, Member, Newcomer, WorkforceMember } from '../types';
import { openFlutterwaveCheckout } from '../utils/flutterwave';
import { buildWalletFundingRequest, extractFlutterwaveFundingResponse, resolveWalletFundingScope } from '../utils/walletFunding';

type RecipientGroup = '' | 'all-members' | 'newcomers' | 'workforce' | 'custom';

interface Recipient {
  id: string;
  name: string;
  phone: string;
  type: 'member' | 'newcomer' | 'workforce';
}

export function SMS() {
  const { currentAdmin } = useAuth();
  const { church, branches } = useChurch();
  const [wallet, setWallet] = useState<SMSWallet | null>(null);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topping, setTopping] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [newcomers, setNewcomers] = useState<Newcomer[]>([]);
  const [workforce, setWorkforce] = useState<WorkforceMember[]>([]);
  const [loading, setLoading] = useState(true);

  const [recipientGroup, setRecipientGroup] = useState<RecipientGroup>('');
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [message, setMessage] = useState('');
  const [sendMode, setSendMode] = useState<'now' | 'scheduled'>('now');
  const [scheduleAt, setScheduleAt] = useState('');
  const [sending, setSending] = useState(false);
  const { showToast } = useToast();
  const fundingScope = resolveWalletFundingScope(branches, currentAdmin);
  const fundingCtaLabel = wallet ? 'Top Up Credits' : 'Create & Fund Wallet';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [w, m, nc, wf] = await Promise.all([
        fetchSMSWallet(),
        fetchMembers(),
        fetchNewcomers(branches[0]?.id),
        fetchWorkforce(),
      ]);
      if (w) setWallet(w as SMSWallet);
      else setWallet(null);
      setMembers(m as Member[]);
      setNewcomers(nc as Newcomer[]);
      setWorkforce(wf as WorkforceMember[]);
    } catch (err) {
      console.error('Failed to load SMS data:', err);
    } finally {
      setLoading(false);
    }
  }, [branches]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (!amount || amount <= 0) return;

    const { branchId } = fundingScope;
    if (!branchId) {
      showToast('No branch found', 'error');
      return;
    }

    setTopping(true);
    try {
      const response = await createOrFundWallet(branchId, buildWalletFundingRequest(fundingScope, amount, wallet?.id));
      const fundingResponse = extractFlutterwaveFundingResponse(response);
      if (!fundingResponse) {
        throw new Error(response?.message || 'Unable to start wallet funding.');
      }

      const customerEmail = fundingResponse.customer?.email || currentAdmin?.email;
      const customerName = fundingResponse.customer?.name || currentAdmin?.name || church.name;
      if (!customerEmail || !customerName) {
        throw new Error('Customer details were not returned for checkout.');
      }

      await openFlutterwaveCheckout({
        publicKey: fundingResponse.publicKey,
        txRef: fundingResponse.tx_ref,
        amount: fundingResponse.amount || amount,
        currency: fundingResponse.currency,
        customer: {
          email: customerEmail,
          name: customerName,
        },
        title: church.name || 'Churchset',
        description: wallet ? 'Wallet funding' : 'Wallet creation and funding',
        onComplete: () => {
          showToast('Payment completed. Wallet balance will refresh shortly.');
          void loadData();
        },
        onClose: () => {
          void loadData();
        },
      });

      setTopUpOpen(false);
      setTopUpAmount('');
      showToast(response?.message || 'Flutterwave checkout opened.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Wallet funding failed.';
      showToast('Wallet funding failed: ' + message, 'error');
    } finally {
      setTopping(false);
    }
  };

  const openFundingDialog = () => setTopUpOpen(true);

  const availableRecipients: Recipient[] = useMemo(() => {
    switch (recipientGroup) {
      case 'all-members':
        return members
          .filter(m => m.phone)
          .map(m => ({ id: m.id, name: m.fullName, phone: m.phone, type: 'member' as const }));
      case 'newcomers':
        return newcomers
          .filter(n => n.phone && !n.movedToMemberId)
          .map(n => ({ id: n.id, name: `${n.firstName} ${n.lastName}`, phone: n.phone!, type: 'newcomer' as const }));
      case 'workforce': {
        const wfMemberIds = new Set(workforce.map(w => w.memberId));
        return members
          .filter(m => wfMemberIds.has(m.id) && m.phone)
          .map(m => ({ id: m.id, name: m.fullName, phone: m.phone, type: 'workforce' as const }));
      }
      default:
        return [];
    }
  }, [recipientGroup, members, newcomers, workforce]);

  const filteredRecipients = availableRecipients.filter(r => {
    if (!recipientSearch) return true;
    const search = recipientSearch.toLowerCase();
    return r.name.toLowerCase().includes(search) || r.phone.includes(recipientSearch);
  });

  const selectedRecipients = availableRecipients.filter(recipient => selectedRecipientIds.includes(recipient.id));
  const selectedRecipientNumbers = Array.from(new Set(selectedRecipients.map(recipient => recipient.phone).filter(Boolean)));
  const selectedFollowUpIds = selectedRecipients
    .filter(recipient => recipient.type === 'newcomer')
    .map(recipient => recipient.id);

  const allSelected = filteredRecipients.length > 0 && filteredRecipients.every(r => selectedRecipientIds.includes(r.id));
  const toggleSelectAll = () => {
    if (allSelected) {
      const removeIds = new Set(filteredRecipients.map(r => r.id));
      setSelectedRecipientIds(prev => prev.filter(id => !removeIds.has(id)));
    } else {
      const addIds = filteredRecipients.map(r => r.id);
      setSelectedRecipientIds(prev => [...new Set([...prev, ...addIds])]);
    }
  };

  const toggleRecipient = (id: string) => {
    setSelectedRecipientIds(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]));
  };

  const handleGroupChange = (value: RecipientGroup) => {
    setRecipientGroup(value);
    setSelectedRecipientIds([]);
    setRecipientSearch('');
  };

  const handleSendSms = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || selectedRecipientNumbers.length === 0) return;

    if (sendMode === 'scheduled') {
      const scheduledDate = new Date(scheduleAt);
      if (!scheduleAt || Number.isNaN(scheduledDate.getTime())) {
        showToast('Choose a valid date and time for the scheduled SMS.', 'error');
        return;
      }
      if (scheduledDate.getTime() <= Date.now()) {
        showToast('Scheduled SMS time must be in the future.', 'error');
        return;
      }
    } else if (!wallet?.id) {
      showToast('Fund your SMS wallet before sending messages.', 'error');
      return;
    }

    setSending(true);
    try {
      const response = await sendSms({
        message: trimmedMessage,
        ...(wallet?.id ? { walletId: wallet.id } : {}),
        toNumbers: selectedRecipientNumbers,
        channel: 'generic',
        ...(selectedFollowUpIds.length > 0 ? { followUpIds: selectedFollowUpIds } : {}),
        ...(sendMode === 'scheduled' && scheduleAt ? { sendAt: new Date(scheduleAt).toISOString() } : {}),
      });

      await loadData();
      setMessage('');
      setSelectedRecipientIds([]);
      setRecipientSearch('');
      setSendMode('now');
      setScheduleAt('');
      showToast(response?.message || (sendMode === 'scheduled' ? 'SMS scheduled successfully.' : 'SMS sent successfully.'));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send SMS.';
      showToast(errorMessage, 'error');
    } finally {
      setSending(false);
    }
  };

  const charCount = message.length;
  const smsCredits = Math.max(1, Math.ceil(charCount / 160));
  const isScheduleValid = sendMode !== 'scheduled'
    || (Boolean(scheduleAt) && !Number.isNaN(new Date(scheduleAt).getTime()) && new Date(scheduleAt).getTime() > Date.now());
  const canSendSms = selectedRecipientNumbers.length > 0
    && Boolean(message.trim())
    && isScheduleValid
    && (sendMode === 'scheduled' || (!!wallet && wallet.balance > 0));

  return (
    <Layout>
      <PageHeader
        title="SMS Communication"
        description="Send targeted SMS messages to your members, newcomers, or workforce. Select a recipient group, then choose exactly who should receive the message - or select all."
        action={{
          label: fundingCtaLabel,
          onClick: openFundingDialog,
        }}
      />
      <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="lg:col-span-3">
            <BibleLoader message="Loading SMS..." />
          </div>
        ) : (
          <>
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Compose Message</CardTitle>
                  <p className="text-sm text-gray-500">
                    Choose a recipient group first, then pick the specific people you'd like to reach. You can select all at once with the toggle or hand-pick individuals.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>1. Choose Recipient Group</Label>
                    <Select value={recipientGroup} onValueChange={(value: RecipientGroup) => handleGroupChange(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Who do you want to message?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-members">
                          <span className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            All Members
                          </span>
                        </SelectItem>
                        <SelectItem value="newcomers">
                          <span className="flex items-center gap-2">
                            <UserPlus className="w-4 h-4" />
                            Newcomers
                          </span>
                        </SelectItem>
                        <SelectItem value="workforce">
                          <span className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4" />
                            Workforce
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {recipientGroup && (
                    <div className="space-y-2">
                      <Label>2. Select Recipients</Label>
                      {availableRecipients.length === 0 ? (
                        <div className="border border-dashed border-gray-200 rounded-lg p-4 text-center">
                          <p className="text-sm text-gray-500">No recipients found in this group with a phone number.</p>
                        </div>
                      ) : (
                        <>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                              placeholder="Search by name or phone..."
                              value={recipientSearch}
                              onChange={event => setRecipientSearch(event.target.value)}
                              className="pl-10"
                            />
                          </div>
                          <div className="border border-gray-200 rounded-lg max-h-52 overflow-y-auto">
                            <div className="flex items-center gap-3 p-2.5 border-b border-gray-100 bg-gray-50 sticky top-0">
                              <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
                              <span className="text-sm font-medium text-gray-700">Select all ({filteredRecipients.length})</span>
                              {selectedRecipientIds.length > 0 && (
                                <Badge variant="secondary" className="ml-auto text-xs">
                                  {selectedRecipientIds.length} selected
                                </Badge>
                              )}
                            </div>
                            {filteredRecipients.map(recipient => (
                              <label
                                key={recipient.id}
                                className="flex items-center gap-3 p-2.5 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                              >
                                <Checkbox
                                  checked={selectedRecipientIds.includes(recipient.id)}
                                  onCheckedChange={() => toggleRecipient(recipient.id)}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-gray-900 truncate">{recipient.name}</p>
                                  <p className="text-xs text-gray-400">{recipient.phone}</p>
                                </div>
                              </label>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>3. Write Your Message</Label>
                    <Textarea
                      placeholder="Type your message here... Keep it warm and personal!"
                      rows={6}
                      value={message}
                      onChange={event => setMessage(event.target.value)}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>
                        {charCount} character{charCount !== 1 ? 's' : ''} ({smsCredits} SMS credit{smsCredits !== 1 ? 's' : ''} per recipient)
                      </span>
                      <span>Total: ~{smsCredits * selectedRecipientNumbers.length} credits</span>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-lg border border-gray-200 p-4">
                    <div className="space-y-2">
                      <Label>4. Delivery</Label>
                      <Select value={sendMode} onValueChange={(value: 'now' | 'scheduled') => {
                        setSendMode(value);
                        if (value === 'now') setScheduleAt('');
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose how to send this SMS" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="now">Send Now</SelectItem>
                          <SelectItem value="scheduled">Schedule SMS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {sendMode === 'scheduled' && (
                      <div className="space-y-2">
                        <Label htmlFor="sms-send-at">Send At</Label>
                        <Input
                          id="sms-send-at"
                          type="datetime-local"
                          value={scheduleAt}
                          onChange={event => setScheduleAt(event.target.value)}
                        />
                        <p className="text-xs text-gray-500">Scheduled SMS is converted from your local time to UTC before it is sent to the API.</p>
                      </div>
                    )}
                  </div>

                  <Button
                    className="w-full"
                    disabled={!canSendSms || sending}
                    onClick={handleSendSms}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {sending
                      ? (sendMode === 'scheduled' ? 'Scheduling...' : 'Sending...')
                      : `${sendMode === 'scheduled' ? 'Schedule for' : 'Send to'} ${selectedRecipientNumbers.length} Recipient${selectedRecipientNumbers.length !== 1 ? 's' : ''}`}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Wallet Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  {wallet ? (
                    <>
                      <div className="text-center mb-4">
                        <p className="text-4xl font-bold text-blue-600">{(wallet.balance ?? 0).toLocaleString()}</p>
                        <p className="text-sm text-gray-600">SMS Credits</p>
                      </div>
                      <Button variant="outline" className="w-full" onClick={openFundingDialog}>
                        {fundingCtaLabel}
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <Inbox className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-3">No SMS wallet set up yet.</p>
                      <Button variant="outline" className="w-full" onClick={openFundingDialog}>
                        Create &amp; Fund Wallet
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Members with phone</span>
                    <span className="font-medium">{members.filter(member => member.phone).length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Newcomers with phone</span>
                    <span className="font-medium">{newcomers.filter(newcomer => newcomer.phone && !newcomer.movedToMemberId).length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Workforce members</span>
                    <span className="font-medium">{workforce.length}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>

      <Dialog open={topUpOpen} onOpenChange={setTopUpOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{wallet ? 'Add SMS Credits' : 'Create & Fund SMS Wallet'}</DialogTitle>
            <DialogDescription>
              {wallet
                ? 'Enter the amount you want to add to this wallet. Flutterwave checkout will open next.'
                : 'Enter the amount to create this wallet and launch Flutterwave checkout.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="sms-topup-amount">Amount</Label>
              <Input
                id="sms-topup-amount"
                type="number"
                min="1"
                placeholder="e.g. 5000"
                value={topUpAmount}
                onChange={event => setTopUpAmount(event.target.value)}
                onKeyDown={event => event.key === 'Enter' && handleTopUp()}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setTopUpOpen(false); setTopUpAmount(''); }} disabled={topping}>
                Cancel
              </Button>
              <Button onClick={handleTopUp} disabled={!topUpAmount || parseFloat(topUpAmount) <= 0 || topping}>
                {topping ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</> : fundingCtaLabel}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

