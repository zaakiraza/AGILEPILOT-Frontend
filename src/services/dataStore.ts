import { storage } from '../library/storage';

const KEY = 'agilepilot_v1';
const defaultState = { users: [], projects: [], sprints: [], tasks: [] };

export const DataStore = {
  state: storage.get(KEY, defaultState),
  save() { storage.set(KEY, this.state); },
  createUser(user) { this.state.users.push(user); this.save(); return user; },
  getUserByEmail(email) { return this.state.users.find(u => u.email === email); },
  createProject(p) { p.id = 'p_' + Date.now(); this.state.projects.push(p); this.save(); return p; },
  getProjects() { return [...this.state.projects]; },
  createSprint(s) { s.id = 's_' + Date.now(); this.state.sprints.push(s); this.save(); return s; },
  getSprintsForProject(projectId) { return this.state.sprints.filter(s => s.projectId === projectId); },
  // add tasks, update, delete as needed
};