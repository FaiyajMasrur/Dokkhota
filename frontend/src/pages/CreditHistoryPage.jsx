import { useEffect, useState } from "react";
import creditService from "../services/creditService.js";

const CreditHistoryPage = () => {
  const [balance, setBalance] = useState({
    creditBalance: 0,
    heldCredits: 0,
    availableBalance: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCreditData = async () => {
    try {
      setLoading(true);
      setError("");
      const [balRes, txRes] = await Promise.all([
        creditService.getBalance(),
        creditService.getTransactions(),
      ]);

      if (balRes.data) {
        setBalance({
          creditBalance: balRes.data.creditBalance ?? 0,
          heldCredits: balRes.data.heldCredits ?? 0,
          availableBalance: balRes.data.availableBalance ?? balRes.data.creditBalance ?? 0,
        });
      }

      if (txRes.data) {
        setTransactions(txRes.data.transactions || []);
      }
    } catch (err) {
      console.error("Credit history fetch error:", err);
      setError("Failed to load credit transaction history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreditData();
  }, []);

  const getTypeBadge = (type) => {
    switch (type) {
      case "earn":
        return <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full uppercase">Earned</span>;
      case "spend":
        return <span className="bg-rose-100 text-rose-800 text-xs font-semibold px-2.5 py-1 rounded-full uppercase">Spent</span>;
      case "hold":
        return <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-full uppercase">Held</span>;
      case "refund":
        return <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full uppercase">Refunded</span>;
      case "starter":
        return <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-1 rounded-full uppercase">Starter</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-1 rounded-full uppercase">{type}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-5xl mx-auto px-4">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Credit Transaction Ledger</h1>
              <p className="text-slate-500 text-sm mt-1">Track all your skill credit earnings, holds, spendings, and refunds.</p>
            </div>
            <button
              onClick={fetchCreditData}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3 py-2 rounded-lg transition"
            >
              Refresh
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Balance Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/60 rounded-2xl p-5">
              <span className="text-xs font-semibold text-emerald-700 tracking-wider uppercase">Total Balance</span>
              <div className="text-3xl font-extrabold text-emerald-900 mt-2">
                {balance.creditBalance} <span className="text-sm font-medium">SC</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/60 rounded-2xl p-5">
              <span className="text-xs font-semibold text-amber-700 tracking-wider uppercase">Held Credits</span>
              <div className="text-3xl font-extrabold text-amber-900 mt-2">
                {balance.heldCredits} <span className="text-sm font-medium">SC</span>
              </div>
              <p className="text-xs text-amber-600 mt-1">Locked in active session bookings</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/60 rounded-2xl p-5">
              <span className="text-xs font-semibold text-blue-700 tracking-wider uppercase">Available Balance</span>
              <div className="text-3xl font-extrabold text-blue-900 mt-2">
                {balance.availableBalance} <span className="text-sm font-medium">SC</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">Ready for booking new sessions</p>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-4 border-b">Type</th>
                  <th className="p-4 border-b">Amount</th>
                  <th className="p-4 border-b">Description</th>
                  <th className="p-4 border-b">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-slate-400">
                      Loading credit transactions...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-10 text-slate-400">
                      No credit transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50 transition">
                      <td className="p-4">{getTypeBadge(item.type)}</td>
                      <td className={`p-4 font-bold ${item.type === 'earn' || item.type === 'refund' || item.type === 'starter' ? 'text-emerald-600' : item.type === 'spend' ? 'text-rose-600' : 'text-amber-600'}`}>
                        {item.type === 'earn' || item.type === 'refund' || item.type === 'starter' ? '+' : '-'}{item.amount} SC
                      </td>
                      <td className="p-4 font-medium text-slate-800">{item.description}</td>
                      <td className="p-4 text-xs text-slate-500">
                        {new Date(item.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditHistoryPage;