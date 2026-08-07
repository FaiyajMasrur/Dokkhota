import { useEffect, useState } from "react";

const CreditHistoryPage = () => {

  const [balance, setBalance] = useState({});
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {

    fetch("http://localhost:5000/api/credits/balance", {
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => setBalance(data));

    fetch("http://localhost:5000/api/credits/transactions", {
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => setTransactions(data.transactions || []));

  }, []);

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="max-w-5xl mx-auto p-8">

        <div className="bg-white rounded-3xl shadow-sm p-8">

          <h1 className="text-3xl font-semibold mb-6">
            Credit History
          </h1>

          <div className="grid md:grid-cols-3 gap-4 mb-8">

            <div className="border rounded-xl p-5">
              <h2 className="font-semibold">Total Credits</h2>
              <p className="text-2xl">{balance.creditBalance}</p>
            </div>

            <div className="border rounded-xl p-5">
              <h2 className="font-semibold">Held Credits</h2>
              <p className="text-2xl">{balance.heldCredits}</p>
            </div>

            <div className="border rounded-xl p-5">
              <h2 className="font-semibold">Available</h2>
              <p className="text-2xl">{balance.availableBalance}</p>
            </div>

          </div>

          <table className="w-full border">

            <thead className="bg-gray-100">

              <tr>

                <th className="border p-3">Type</th>

                <th className="border p-3">Amount</th>

                <th className="border p-3">Description</th>

                <th className="border p-3">Date</th>

              </tr>

            </thead>

            <tbody>

              {transactions.length === 0 ? (

                <tr>

                  <td
                    colSpan="4"
                    className="text-center p-5"
                  >
                    No Transactions
                  </td>

                </tr>

              ) : (

                transactions.map((item) => (

                  <tr key={item._id}>

                    <td className="border p-3">
                      {item.type}
                    </td>

                    <td className="border p-3">
                      {item.amount}
                    </td>

                    <td className="border p-3">
                      {item.description}
                    </td>

                    <td className="border p-3">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );

};

export default CreditHistoryPage;