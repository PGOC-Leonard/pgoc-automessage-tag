import React from "react";

function StatusWidget({ numberOfConversations = "", successfulResponses = "", failedResponses = "" }) {
  return (
    <div className="w-[770px] flex items-center rounded-md p-2 space-x-2 font-montserrat mt-2">
      {/* Label and Value Groups */}
      <div className="flex items-center space-x-2">
        <label className="text-[12px] font-semibold whitespace-nowrap">
          Number of Conversations Taken:
        </label>
        <div className="bg-gray-300 px-1 py-1.5 rounded-md text-[12px] text-center w-[36px] h-[30px]">
          {numberOfConversations}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <label className="text-[12px] font-semibold whitespace-nowrap">
          Number of Successful Responses:
        </label>
        <div className="bg-gray-300 px-1 py-1.5 rounded-md text-[12px] text-center w-[36px] h-[30px]">
          {successfulResponses}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <label className="text-[12px] font-semibold whitespace-nowrap">
          Number of Failed Responses:
        </label>
        <div className="bg-gray-300 px-1 py-1.5 rounded-md text-[12px] text-center w-[36px] h-[30px]">
          {failedResponses}
        </div>
      </div>
    </div>
  );
}

export default StatusWidget;
