import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Search, 
  Download,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { useFinancials } from '@/hooks/useFinancials';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

const typeColors: Record<string, string> = {
  revenue: 'bg-green-100 text-green-800',
  cost: 'bg-red-100 text-red-800',
  refund: 'bg-orange-100 text-orange-800',
  adjustment: 'bg-blue-100 text-blue-800',
  fee: 'bg-purple-100 text-purple-800',
};

export default function FinancialTransactions() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);

  const { transactions, metrics, loading, refetch, reconcileTransactions } = useFinancials({
    transactionType: typeFilter !== 'all' ? [typeFilter as any] : undefined,
    search: search || undefined,
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTransactions(transactions.filter(t => !t.is_reconciled).map(t => t.id));
    } else {
      setSelectedTransactions([]);
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedTransactions(prev => [...prev, id]);
    } else {
      setSelectedTransactions(prev => prev.filter(i => i !== id));
    }
  };

  const handleReconcile = async () => {
    await reconcileTransactions(selectedTransactions);
    setSelectedTransactions([]);
  };

  const filteredTransactions = transactions.filter(t => {
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        t.description?.toLowerCase().includes(searchLower) ||
        t.reference_number?.toLowerCase().includes(searchLower) ||
        t.company?.name?.toLowerCase().includes(searchLower) ||
        t.delivery_order?.order_number?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
          <p className="text-muted-foreground">View and manage all financial transactions</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="cost">Cost</SelectItem>
                <SelectItem value="refund">Refund</SelectItem>
                <SelectItem value="adjustment">Adjustment</SelectItem>
                <SelectItem value="fee">Fee</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Bulk Actions */}
          {selectedTransactions.length > 0 && (
            <div className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-muted">
              <span className="text-sm font-medium">
                {selectedTransactions.length} selected
              </span>
              <div className="flex-1" />
              <Button size="sm" onClick={handleReconcile}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Reconciled
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={
                      selectedTransactions.length === 
                      transactions.filter(t => !t.is_reconciled).length &&
                      transactions.filter(t => !t.is_reconciled).length > 0
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No transactions found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map(transaction => (
                  <TableRow key={transaction.id}>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {!transaction.is_reconciled && (
                        <Checkbox
                          checked={selectedTransactions.includes(transaction.id)}
                          onCheckedChange={(checked) => handleSelect(transaction.id, !!checked)}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(transaction.transaction_date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge className={typeColors[transaction.transaction_type]}>
                        {transaction.transaction_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">
                      {transaction.category.replace(/_/g, ' ')}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {transaction.description || '-'}
                    </TableCell>
                    <TableCell>{transaction.company?.name || '-'}</TableCell>
                    <TableCell>
                      {transaction.delivery_order?.order_number || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className={`flex items-center justify-end gap-1 font-medium ${
                        transaction.transaction_type === 'revenue' 
                          ? 'text-green-600' 
                          : transaction.transaction_type === 'cost'
                            ? 'text-red-600'
                            : ''
                      }`}>
                        {transaction.transaction_type === 'revenue' ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : transaction.transaction_type === 'cost' ? (
                          <ArrowDownRight className="h-4 w-4" />
                        ) : null}
                        ${Number(transaction.amount).toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {transaction.is_reconciled ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Reconciled
                        </Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-xl font-bold text-green-600">
                  ${metrics.totalRevenue.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Costs</p>
                <p className="text-xl font-bold text-red-600">
                  ${metrics.totalCosts.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Net</p>
                <p className={`text-xl font-bold ${metrics.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${metrics.grossProfit.toLocaleString()}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Showing {filteredTransactions.length} transactions
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
