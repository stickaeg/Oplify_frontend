import { useState } from "react";
import StoreTable from "../components/StoreTable";
import RulesTable from "../components/RulesTable";
import CreateStore from "../components/CreateStore";
import CreateRule from "../components/CreateRule";
import CreateBatch from "../components/CreateBatch"; // ✅ Import your new component

const Dashboard = () => {
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [isRuleOpen, setIsRuleOpen] = useState(false);
  const [isBatchOpen, setIsBatchOpen] = useState(false); // ✅ new state for batch modal

  return (
    <div className="p-4 space-y-4">
      {/* Buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setIsStoreOpen(true)}
          className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          + Create Store
        </button>

        <button
          onClick={() => setIsRuleOpen(true)}
          className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
        >
          + Create Rule
        </button>

        <button
          onClick={() => setIsBatchOpen(true)}
          className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700"
        >
          + Create Batch
        </button>
      </div>
      {/* Tables */}
      <StoreTable />
      <RulesTable />
      {/* Create Store Modal */}
      {isStoreOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/20 z-50">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <CreateStore onClose={() => setIsStoreOpen(false)} />
          </div>
        </div>
      )}
      {/* Create Rule Modal */}
      {isRuleOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/20 z-50">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <CreateRule onClose={() => setIsRuleOpen(false)} />
          </div>
        </div>
      )}
      {/* ✅ Create Batch Modal */}
      {isBatchOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/20 z-50">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <CreateBatch onClose={() => setIsBatchOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
