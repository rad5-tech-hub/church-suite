import { useState, useEffect, useCallback } from 'react';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { BibleLoader } from '../components/BibleLoader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Wallet as WalletIcon, TrendingUp, TrendingDown, Inbox, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useChurch } from '../context/ChurchContext';
import { useToast } from '../context/ToastContext';
import { fetchSMSWallet, createOrFundWallet } from '../api';
import { SMSWallet } from '../types';

export function Wallet() {
  const { church, branches } = useChurch();
  const { showToast } = useToast();
  const [wallet, setWallet] = useState<SMSWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topping, setTopping] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const w = await fetchSMSWallet();
      if (w) {
        setWallet(w as SMSWallet);
      } else {
        setWallet(null);
      }
    } catch (err) {
      console.error('Failed to load SMS wallet:', err);
    } finally {
      setLoading(false);
    }
  }, [church.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const initWallet = async () => {
    try {
      const branchId = branches[0]?.id;
      if (!branchId) {
        console.error('No branch available to create wallet');
        return;
      }
      const res = await createOrFundWallet(branchId, {
        action: 'create',
        walletType: 'personal',
      });
      if (res?.wallet) {
        setWallet({
          id: res.wallet.id,
          churchId: res.wallet.churchId || church.id,
          balance: parseFloat(res.wallet.balance) || 0,
          transactions: [],
        });
      } else {
        await loadData();
      }
    } catch (err) {
      console.error('Failed to initialize wallet:', err);
    }
  };

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

  return (
    <Layout>
      <PageHeader
        title="SMS Wallet"
        description="Manage your SMS credits, view transaction history, and top up your balance for sending messages."
        action={wallet ? {
          label: 'Add Credits',
          onClick: () => setTopUpOpen(true),
        } : undefined}
      />
      <div className="p-4 md:p-6 space-y-6">
        {loading ? (
          <BibleLoader message="Loading wallet..." />
        ) : !wallet ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4">
                <WalletIcon className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No SMS wallet yet</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-4">
                Set up your SMS wallet to start sending messages to your members. You'll be able to track credits and transaction history here.
              </p>
              <Button onClick={initWallet}>Initialize Wallet</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-4">
                  <WalletIcon className="w-12 h-12 text-blue-600" />
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Current Balance</p>
                    <p className="text-5xl font-bold text-gray-900">{(wallet.balance ?? 0).toLocaleString()}</p>
                    <p className="text-sm text-gray-600 mt-1">SMS Credits</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {(wallet.transactions ?? []).length === 0 ? (
                  <div className="text-center py-12">
                    <Inbox className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No transactions recorded yet. Top up your wallet to get started.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(wallet.transactions ?? []).map((txn) => (
                        <TableRow key={txn.id}>
                          <TableCell>{new Date(txn.date).toLocaleDateString()}</TableCell>
                          <TableCell>{txn.description}</TableCell>
                          <TableCell>
                            <Badge variant={txn.type === 'credit' ? 'default' : 'secondary'}>
                              {txn.type === 'credit' ? (
                                <TrendingUp className="w-3 h-3 mr-1" />
                              ) : (
                                <TrendingDown className="w-3 h-3 mr-1" />
                              )}
                              {txn.type}
                            </Badge>
                          </TableCell>
                          <TableCell className={`text-right font-semibold ${txn.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                            {txn.type === 'credit' ? '+' : '-'}{(txn.amount ?? 0).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
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
              <Label htmlFor="topup-amount">Amount (credits)</Label>
              <Input
                id="topup-amount"
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
