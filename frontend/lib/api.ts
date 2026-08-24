import {
    Agent,
    MetricsSnapshot,
    SimulationRequest,
    SimulationResult,
    RecommendationRequest,
    RecommendationResult,
    RecommendedPolicy,
    PolicyCreate,
    Policy,
    SimulationHistory,
  } from "@/types/agent";
  
  
  const API_URL =
    process.env.NEXT_PUBLIC_API_URL;
  
  
  if (!API_URL) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not configured."
    );
  }
  
  
  /* =========================================================
     AGENTS
  ========================================================= */
  
  
  export async function getAgents(): Promise<Agent[]> {
  
    const response = await fetch(
      `${API_URL}/agents`,
      {
        cache: "no-store",
      }
    );
  
    if (!response.ok) {
  
      const errorText = await response.text();
  
      throw new Error(
        `Failed to load AI employees: ${response.status} ${errorText}`
      );
    }
  
    return response.json();
  }
  
  
  /* =========================================================
     METRICS
  ========================================================= */
  
  
  export async function getAgentMetrics(
    agentId: number
  ): Promise<MetricsSnapshot> {
  
    const response = await fetch(
      `${API_URL}/agents/${agentId}/metrics`,
      {
        cache: "no-store",
      }
    );
  
    if (!response.ok) {
  
      const errorText = await response.text();
  
      throw new Error(
        `Failed to load agent metrics: ${response.status} ${errorText}`
      );
    }
  
    return response.json();
  }
  
  
  /* =========================================================
     POLICY SIMULATOR
  ========================================================= */
  
  
  export async function simulatePolicy(
    agentId: number,
    policy: SimulationRequest
  ): Promise<SimulationResult> {
  
    const response = await fetch(
      `${API_URL}/agents/${agentId}/simulate`,
      {
        method: "POST",
  
        headers: {
          "Content-Type": "application/json",
        },
  
        body: JSON.stringify(policy),
      }
    );
  
    if (!response.ok) {
  
      const errorText = await response.text();
  
      throw new Error(
        `Simulation failed: ${response.status} ${errorText}`
      );
    }
  
    return response.json();
  }
  
  
  /* =========================================================
     GOVERNOR RECOMMENDATIONS
  ========================================================= */
  
  
  export async function recommendPolicy(
    agentId: number,
    request: RecommendationRequest
  ): Promise<RecommendationResult> {
  
    const response = await fetch(
      `${API_URL}/agents/${agentId}/recommend`,
      {
        method: "POST",
  
        headers: {
          "Content-Type": "application/json",
        },
  
        body: JSON.stringify(request),
      }
    );
  
    if (!response.ok) {
  
      const errorText = await response.text();
  
      throw new Error(
        `Recommendation failed: ${response.status} ${errorText}`
      );
    }
  
    return response.json();
  }
  
  
  /* =========================================================
     SAVED POLICIES
  ========================================================= */
  
  
  export async function savePolicy(
    agentId: number,
    policy: PolicyCreate
  ): Promise<Policy> {
  
    const response = await fetch(
      `${API_URL}/agents/${agentId}/policies`,
      {
        method: "POST",
  
        headers: {
          "Content-Type": "application/json",
        },
  
        body: JSON.stringify(policy),
      }
    );
  
    if (!response.ok) {
  
      const errorText = await response.text();
  
      throw new Error(
        `Failed to save policy: ${response.status} ${errorText}`
      );
    }
  
    return response.json();
  }
  
  
  export async function getPolicies(
    agentId: number
  ): Promise<Policy[]> {
  
    const response = await fetch(
      `${API_URL}/agents/${agentId}/policies`,
      {
        cache: "no-store",
      }
    );
  
    if (!response.ok) {
  
      const errorText = await response.text();
  
      throw new Error(
        `Failed to load policies: ${response.status} ${errorText}`
      );
    }
  
    return response.json();
  }
  
  
  /* =========================================================
     POLICY ACTIVATION
  ========================================================= */
  
  
  export async function activatePolicy(
    agentId: number,
    policyId: number
  ): Promise<Policy> {
  
    const response = await fetch(
      `${API_URL}/agents/${agentId}/policies/${policyId}/activate`,
      {
        method: "PATCH",
  
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  
    if (!response.ok) {
  
      const errorText = await response.text();
  
      throw new Error(
        `Failed to activate policy: ${response.status} ${errorText}`
      );
    }
  
    return response.json();
  }
  
  
  /* =========================================================
     SIMULATION HISTORY
  ========================================================= */
  
  
  export async function getSimulations(
    agentId: number
  ): Promise<SimulationHistory[]> {
  
    const response = await fetch(
      `${API_URL}/agents/${agentId}/simulations`,
      {
        cache: "no-store",
      }
    );
  
    if (!response.ok) {
  
      const errorText = await response.text();
  
      throw new Error(
        `Failed to load simulations: ${response.status} ${errorText}`
      );
    }
  
    return response.json();
  }

  export async function getTopPolicies(
    agentId: number,
    maxErrorRate: number,
    topN: number = 20
  ): Promise<RecommendedPolicy[]> {
  
    const response = await fetch(
      `${API_URL}/agents/${agentId}/recommendations/top?max_error_rate=${maxErrorRate}&top_n=${topN}`,
      {
        cache: "no-store",
      }
    );
  
    if (!response.ok) {
  
      const errorText = await response.text();
  
      throw new Error(
        `Failed to load policy frontier: ${response.status} ${errorText}`
      );
    }
  
    return response.json();
  }