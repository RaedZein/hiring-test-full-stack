export interface Deliverable {
  title: string;
  description: string;
}

export interface Workstream {
  title: string;
  description: string;
  deliverables: Deliverable[];
}

export interface ProjectPlan {
  workstreams: Workstream[];
}
