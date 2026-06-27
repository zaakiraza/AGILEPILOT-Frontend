export interface User {
  _id: string;
  name: string;
  email: string;
  orgRole: "superAdmin" | "admin" | "member";
  organizationId?: string | null;
  isActive: boolean;
  isEmailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Organization {
  _id: string;
  name: string;
  slug: string;
  settings?: { defaultCurrency?: string };
  createdBy?: string;
  createdAt?: string;
}

export interface Project {
  _id: string;
  name: string;
  description?: string;
  status: string;
  currency: string;
  startDate?: string;
  endDate?: string;
  organizationId: string;
  projectManagerId?: User | string | null;
  createdAt?: string;
}

export interface ProjectMember {
  _id: string;
  projectId: string;
  userId: User | string;
  projectRole: "projectManager" | "teamLead" | "teamMember";
}

export interface Milestone {
  _id: string;
  projectId: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: string;
  order: number;
}

export interface Task {
  _id: string;
  projectId: string;
  milestoneId: string | Milestone;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  assigneeId?: User | string | null;
  estimatedHours?: number;
  actualHours?: number;
  hourlyRate?: number;
  parentTaskId?: string | null;
  dependsOn?: string[];
  order?: number;
}

export interface TaskComment {
  _id: string;
  taskId: string;
  userId: User;
  text: string;
  createdAt: string;
}

export interface EstimateLineItem {
  category: string;
  description: string;
  quantity: number;
  unitCost: number;
  amount: number;
}

export interface CostEstimate {
  _id: string;
  projectId: string;
  currency: string;
  lineItems: EstimateLineItem[];
  contingencyPercent: number;
  notes?: string;
}

export interface EstimateSummary {
  currency: string;
  laborFromTasks: number;
  lineItemsTotal: number;
  subtotal: number;
  contingencyPercent: number;
  contingencyAmount: number;
  grandTotal: number;
  taskBreakdown: Array<{
    taskId: string;
    title: string;
    estimatedHours: number;
    hourlyRate: number;
    estimatedCost: number;
  }>;
  lineItems: EstimateLineItem[];
  notes?: string;
}

export interface BudgetExpense {
  _id: string;
  date: string;
  category: string;
  amount: number;
  description?: string;
}

export interface Budget {
  _id: string;
  projectId: string;
  allocatedAmount: number;
  currency: string;
  expenses: BudgetExpense[];
}

export interface BudgetAnalysis {
  currency: string;
  allocatedAmount: number;
  estimatedCost: number;
  estimateVariance: number;
  actualLaborCost: number;
  expensesTotal: number;
  totalSpent: number;
  variance: number;
  utilizationPercent: number;
  burnRatePerWeek: number;
  weeksElapsed: number;
  expenses: BudgetExpense[];
}

export interface ProgressReport {
  _id: string;
  projectId: string;
  milestoneId?: Milestone | string | null;
  taskId?: Task | string | null;
  submittedBy: User;
  periodStart: string;
  periodEnd: string;
  manualNotes?: string;
  autoCompletionPercent: number;
  combinedSummary?: string;
  createdAt: string;
}

export interface ApiEnvelope<T> {
  status: string;
  message: string;
  data: T;
}
