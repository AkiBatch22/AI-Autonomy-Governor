export interface Agent {
    id: number;
    name: string;
    department: string;
    workflow: string;
    created_at: string;
  }
  
  
  export interface OverviewMetrics {
    total_tasks: number;
    autonomous_tasks: number;
    human_reviews: number;
    autonomy_rate: number;
    human_review_rate: number;
    overall_accuracy: number;
    autonomous_accuracy: number | null;
    autonomous_error_rate: number | null;
    avg_processing_time_seconds: number;
  }
  
  
  export interface SegmentMetric {
    total_tasks: number;
    accuracy: number;
    human_review_rate: number;
    error_rate: number;
  
    [key: string]: string | number;
  }
  
  
  export interface MetricsSnapshot {
    overview: OverviewMetrics;
    confidence_performance: SegmentMetric[];
    risk_performance: SegmentMetric[];
    vendor_performance: SegmentMetric[];
    workflow_performance: SegmentMetric[];
  }
  
  
  /* -----------------------------
     POLICY SIMULATOR
  ----------------------------- */
  
  export interface SimulationRequest {
    confidence_threshold: number;
    max_transaction_value: number;
    max_error_rate: number;
  }
  
  
  export interface PolicyMetrics {
    total_tasks: number;
    autonomous_tasks: number;
    human_reviews: number;
    autonomy_rate: number;
    accuracy: number;
    error_rate: number;
  }
  
  
  export interface SimulationResult {
    simulation_id?: number;
  
    current: PolicyMetrics;
  
    proposed: PolicyMetrics;
  
    impact: {
      autonomy_change: number;
      human_reviews_saved: number;
    };
  
    risk: {
      maximum_allowed_error_rate: number;
      status: "pass" | "fail";
    };
  }
  
  
  /* -----------------------------
     GOVERNOR RECOMMENDATIONS
  ----------------------------- */
  
  export interface RecommendationRequest {
    max_error_rate: number;
    minimum_sample_size: number;
  }
  
  
  export interface RecommendedPolicy {
    confidence_threshold: number;
    max_transaction_value: number;
  
    autonomous_tasks: number;
    human_reviews: number;
  
    autonomy_rate: number;
    accuracy: number;
    error_rate: number;
  
    human_reviews_saved: number;
    autonomy_change: number;
  
    risk_status: "pass" | "fail";
  }
  
  
  export interface RecommendationResult {
    recommendation: RecommendedPolicy;
    safe_policies_tested: number;
    total_policies_tested: number;
  }
  
  
  /* -----------------------------
     SAVED POLICIES
  ----------------------------- */
  
  export interface PolicyCreate {
    name: string;
    minimum_confidence: number;
    maximum_transaction_value: number;
    maximum_error_rate: number;
  }
  
  
  export interface Policy {
    id: number;
    agent_id: number;
  
    name: string;
  
    minimum_confidence: number;
    maximum_transaction_value: number;
    maximum_error_rate: number;
  
    status: string;
    created_at: string;
  }
  
  
  /* -----------------------------
     AUDIT TRAIL
  ----------------------------- */
  
  export interface SimulationHistory {
    id: number;
    agent_id: number;
    policy_id: number | null;
  
    confidence_threshold: number;
    max_transaction_value: number;
    max_error_rate: number;
  
    current_autonomy_rate: number;
    current_error_rate: number;
  
    proposed_autonomy_rate: number;
    proposed_accuracy: number;
    proposed_error_rate: number;
  
    autonomous_tasks: number;
    human_reviews: number;
  
    autonomy_change: number;
    human_reviews_saved: number;
  
    risk_status: string;
  
    created_at: string;
  }