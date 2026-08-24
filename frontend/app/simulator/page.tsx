import Link from "next/link";

import PolicySimulator from "@/components/PolicySimulator";

import {
  getAgents,
} from "@/lib/api";


interface SimulatorPageProps {
  searchParams: Promise<{
    agentId?: string;
  }>;
}


export default async function SimulatorPage({
  searchParams,
}: SimulatorPageProps) {

  const params = await searchParams;

  const agents = await getAgents();


  if (agents.length === 0) {

    return (
      <main className="min-h-screen bg-gray-50 p-10">
        No AI employees available.
      </main>
    );

  }


  const requestedAgentId =
    Number(params.agentId);


  const defaultAgent =
    agents.find(
      (agent) =>
        agent.name === "Accounts Payable AI"
    ) ?? agents[0];


  const agent =
    agents.find(
      (agent) =>
        agent.id === requestedAgentId
    ) ?? defaultAgent;


  const agentQuery =
    `?agentId=${agent.id}`;


  return (
    <main className="min-h-screen bg-gray-50">

      <div className="mx-auto max-w-7xl px-8 py-10">

        {/* HEADER */}

        <div className="mb-8">

          <p className="text-sm font-medium text-gray-500">
            AI AUTONOMY GOVERNOR
          </p>

          <h1 className="mt-1 text-3xl font-semibold text-gray-900">
            Policy Simulator
          </h1>

          <p className="mt-2 text-gray-500">
            {agent.name}
            {" · "}
            {agent.department}
          </p>


          <div className="mt-5 flex flex-wrap gap-3">

            <Link
              href={`/${agentQuery}`}
              className="inline-flex rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
            >
              ← Back to Dashboard
            </Link>


            <Link
              href={`/recommendations${agentQuery}`}
              className="inline-flex rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
            >
              Ask Governor for a Recommendation →
            </Link>

          </div>

        </div>


        {/* SIMULATOR */}

        <PolicySimulator
          agentId={agent.id}
        />

      </div>

    </main>
  );
}