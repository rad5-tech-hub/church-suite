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
import { useChurch } from '../context/ChurchContext';
import { useToast } from '../context/ToastContext';
import { fetchSMSWallet, createOrFundWallet, fetchMembers, fetchNewcomers, fetchWorkforce } from '../api';
import { SMSWallet, Member, Newcomer, WorkforceMember } from '../types';

type RecipientGroup = '' | 'all-members' | 'newcomers' | 'workforce' | 'custom';

interface Recipient {
  id: string;
  name: string;
  phone: string;
  type: 'member' | 'newcomer' | 'workforce';
}

export function SMS() {
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
  const { showToast } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [w, m, nc, wf] = await Promise.all([
        fetchSMSWallet(), fetchMembers(), fetchNewcomers(branches[0]?.id), fetchWorkforce(),
      ]);
      if (w) setWallet(w as SMSWallet);
      else setWallet(null);
      setMembers(m as Member[]);
      setNewcomers(nc as Newcomer[]);
      setWorkforce(wf as WorkforceMember[]);
    } catch (err) { console.error('Failed to load SMS data:', err); }
    finally { setLoading(false); }
  }, [church.id, branches]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (!amount || amount <= 0 || !wallet) return;
    const branchId = branches[0]?.id;
    if (!branchId) { showToast('No branch found', 'error'); return; }
    setTopping(true);
    try {
      const res = await createOrFundWallet(branchId, { action: 'fund', walletId: wallet.id, amount } as any);
      // API may return a payment URL for external payment processing
      const paymentUrl = res?.authorization_url || res?.data?.authorization_url || res?.paymentUrl || res?.data?.link;
      if (paymentUrl) {
        window.open(paymentUrl, '_blank', 'noopener,noreferrer');
        showToast('Payment page opened. Complete payment to add credits.');
      } else {
        showToast(`${amount.toLocaleString()} credits added successfully.`);
      }
      setTopUpOpen(false);
      setTopUpAmount('');
      await loadData();
    } catch (err: any) {
      showToast(`Top-up failed: ${err.message}`, 'error');
    } finally {
      setTopping(false);
    }
  };

  const initWallet = async () => {
    try {
      const branchId = branches[0]?.id;
      if (!branchId) { console.error('No branch available to create wallet'); return; }
      const res = await createOrFundWallet(branchId, { action: 'create', walletType: 'personal' });
      if (res?.wallet) {
        setWallet({ id: res.wallet.id, churchId: res.wallet.churchId || church.id, balance: parseFloat(res.wallet.balance) || 0, transactions: [] });
      } else { await loadData(); }
    } catch (err) { console.error('Failed to initialize wallet:', err); }
  };

  // Build recipient list based on selected group
  const availableRecipients: Recipient[] = useMemo(() => {
    switch (recipientGroup) {
      case 'all-members':
        return members.filter(m => m.phone).map(m => ({ id: m.id, name: m.fullName, phone: m.phone, type: 'member' as const }));
      case 'newcomers':
        return newcomers.filter(n => n.phone && !n.movedToMemberId).map(n => ({ id: n.id, name: `${n.firstName} ${n.lastName}`, phone: n.phone!, type: 'newcomer' as const }));
      case 'workforce': {
        const wfMemberIds = new Set(workforce.map(w => w.memberId));
        return members.filter(m => wfMemberIds.has(m.id) && m.phone).map(m => ({ id: m.id, name: m.fullName, phone: m.phone, type: 'workforce' as const }));
      }
      default: return [];
    }
  }, [recipientGroup, members, newcomers, workforce]);

  const filteredRecipients = availableRecipients.filter(r => {
    if (!recipientSearch) return true;
    const s = recipientSearch.toLowerCase();
    return r.name.toLowerCase().includes(s) || r.phone.includes(recipientSearch);
  });

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
    setSelectedRecipientIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleGroupChange = (value: RecipientGroup) => {
    setRecipientGroup(value);
    setSelectedRecipientIds([]);
    setRecipientSearch('');
  };

  const charCount = message.length;
  const smsCredits = Math.max(1, Math.ceil(charCount / 160));

  return (
    <Layout>
      <PageHeader
        title="SMS Communication"
        description="Send targeted SMS messages to your members, newcomers, or workforce. Select a recipient group, then choose exactly who should receive the message — or select all."
      />
      <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="lg:col-span-3"><BibleLoader message="Loading SMS..." /></div>
        ) : (
          <>
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Compose Message</CardTitle>
                  <p className="text-sm text-gray-500">Choose a recipient group first, then pick the specific people you'd like to reach. You can select all at once with the toggle or hand-pick individuals.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Step 1: Group */}
                  <div className="space-y-2">
                    <Label>1. Choose Recipient Group</Label>
                    <Select value={recipientGroup} onValueChange={(v: RecipientGroup) => handleGroupChange(v)}>
                      <SelectTrigger><SelectValue placeholder="Who do you want to message?" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-members"><span className="flex items-center gap-2"><Users className="w-4 h-4" />All Members</span></SelectItem>
                        <SelectItem value="newcomers"><span className="flex items-center gap-2"><UserPlus className="w-4 h-4" />Newcomers</span></SelectItem>
                        <SelectItem value="workforce"><span className="flex items-center gap-2"><Briefcase className="w-4 h-4" />Workforce</span></SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Step 2: Individual selection */}
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
                              onChange={e => setRecipientSearch(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                          <div className="border border-gray-200 rounded-lg max-h-52 overflow-y-auto">
                            {/* Select all toggle */}
                            <div className="flex items-center gap-3 p-2.5 border-b border-gray-100 bg-gray-50 sticky top-0">
                              <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
                              <span className="text-sm font-medium text-gray-700">
                                Select all ({filteredRecipients.length})
                              </span>
                              {selectedRecipientIds.length > 0 && (
                                <Badge variant="secondary" className="ml-auto text-xs">{selectedRecipientIds.length} selected</Badge>
                              )}
                            </div>
                            {filteredRecipients.map(r => (
                              <label key={r.id} className="flex items-center gap-3 p-2.5 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0">
                                <Checkbox checked={selectedRecipientIds.includes(r.id)} onCheckedChange={() => toggleRecipient(r.id)} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-gray-900 truncate">{r.name}</p>
                                  <p className="text-xs text-gray-400">{r.phone}</p>
                                </div>
                              </label>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Step 3: Message */}
                  <div className="space-y-2">
                    <Label>3. Write Your Message</Label>
                    <Textarea
                      placeholder="Type your message here... Keep it warm and personal!"
                      rows={6}
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{charCount} character{charCount !== 1 ? 's' : ''} ({smsCredits} SMS credit{smsCredits !== 1 ? 's' : ''} per recipient)</span>
                      <span>Total: ~{smsCredits * selectedRecipientIds.length} credits</span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    disabled={!wallet || wallet.balance <= 0 || selectedRecipientIds.length === 0 || !message.trim()}
                    onClick={() => showToast(`Message would be sent to ${selectedRecipientIds.length} recipients. (SMS sending is a placeholder — connect your SMS provider to go live.)`)}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send to {selectedRecipientIds.length} Recipient{selectedRecipientIds.length !== 1 ? 's' : ''}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Wallet Balance</CardTitle></CardHeader>
                <CardContent>
                  {wallet ? (
                    <>
                      <div className="text-center mb-4">
                        <p className="text-4xl font-bold text-blue-600">{(wallet.balance ?? 0).toLocaleString()}</p>
                        <p className="text-sm text-gray-600">SMS Credits</p>
                      </div>
                      <Button variant="outline" className="w-full" onClick={() => setTopUpOpen(true)}>Top Up Credits</Button>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <Inbox className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-3">No SMS wallet set up yet.</p>
                      <Button variant="outline" className="w-full" onClick={initWallet}>Initialize Wallet</Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick stats */}
              <Card>
                <CardHeader><CardTitle className="text-sm">Quick Stats</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Members with phone</span>
                    <span className="font-medium">{members.filter(m => m.phone).length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Newcomers with phone</span>
                    <span className="font-medium">{newcomers.filter(n => n.phone && !n.movedToMemberId).length}</span>
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

      {/* Top-Up Dialog */}
      <Dialog open={topUpOpen} onOpenChange={setTopUpOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add SMS Credits</DialogTitle>
            <DialogDescription>Enter the number of credits you want to add to your wallet.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="sms-topup-amount">Amount (credits)</Label>
              <Input
                id="sms-topup-amount"
                type="number"
                min="1"
                placeholder="e.g. 1000"
                value={topUpAmount}
                onChange={e => setTopUpAmount(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleTopUp()}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setTopUpOpen(false); setTopUpAmount(''); }} disabled={topping}>
                Cancel
              </Button>
              <Button onClick={handleTopUp} disabled={!topUpAmount || parseFloat(topUpAmount) <= 0 || topping}>
                {topping ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing…</> : 'Add Credits'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
