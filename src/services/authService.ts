import { WarehouseUser, UserRole } from '@/types/warehouse';

// In-memory user storage (simulating database)
let users: WarehouseUser[] = [];

// Generate sample users
const generateSampleUsers = () => {
  const sampleUsers: Omit<WarehouseUser, 'id' | 'created_at' | 'updated_at'>[] = [
    {
      email: 'admin@clearpath.com',
      name: 'John Administrator',
      role: 'warehouse_staff',
      is_active: true
    },
    {
      email: 'staff@clearpath.com',
      name: 'Sarah Wilson',
      role: 'warehouse_staff',
      is_active: true
    },
    {
      email: 'client@acme.com',
      name: 'Michael Johnson',
      role: 'client',
      company_id: 'acme-corp',
      is_active: true
    },
    {
      email: 'client@techstart.com',
      name: 'Emily Davis',
      role: 'client',
      company_id: 'techstart-inc',
      is_active: true
    }
  ];

  users = sampleUsers.map(userData => ({
    ...userData,
    id: Math.random().toString(36).substr(2, 9),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
};

// Authentication functions
export const authenticateUser = async (email: string, password: string): Promise<WarehouseUser | null> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Simple password validation (in real app, use proper hashing)
  if (password !== 'password') {
    return null;
  }
  
  const user = users.find(u => u.email === email && u.is_active);
  return user || null;
};

export const registerUser = async (userData: {
  email: string;
  name: string;
  password: string;
  role: UserRole;
  company_id?: string;
}): Promise<WarehouseUser | null> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Check if user already exists
  if (users.find(u => u.email === userData.email)) {
    throw new Error('User with this email already exists');
  }
  
  // Validate password (basic validation)
  if (userData.password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }
  
  const newUser: WarehouseUser = {
    id: Math.random().toString(36).substr(2, 9),
    email: userData.email,
    name: userData.name,
    role: userData.role,
    company_id: userData.company_id,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  users.push(newUser);
  return newUser;
};

export const getCurrentUser = (userId: string): WarehouseUser | null => {
  return users.find(u => u.id === userId && u.is_active) || null;
};

export const getAllUsers = (): WarehouseUser[] => {
  return users.filter(u => u.is_active);
};

export const updateUser = (userId: string, updates: Partial<WarehouseUser>): WarehouseUser | null => {
  const index = users.findIndex(u => u.id === userId);
  if (index === -1) return null;
  
  users[index] = {
    ...users[index],
    ...updates,
    updated_at: new Date().toISOString()
  };
  
  return users[index];
};

export const deleteUser = (userId: string): boolean => {
  const index = users.findIndex(u => u.id === userId);
  if (index === -1) return false;
  
  // Soft delete by marking as inactive
  users[index].is_active = false;
  users[index].updated_at = new Date().toISOString();
  
  return true;
};

export const hasPermission = (user: WarehouseUser, action: string): boolean => {
  if (user.role === 'warehouse_staff') {
    return true; // Warehouse staff has full access
  }
  
  if (user.role === 'client') {
    // Clients have limited access - only read operations
    const allowedActions = ['read', 'view', 'search'];
    return allowedActions.includes(action);
  }
  
  return false;
};

// Session management
let currentSession: { userId: string; token: string } | null = null;

export const createSession = (user: WarehouseUser): string => {
  const token = Math.random().toString(36).substr(2, 16);
  currentSession = { userId: user.id, token };
  
  // Store in localStorage for persistence
  localStorage.setItem('clearpath_session', JSON.stringify(currentSession));
  localStorage.setItem('clearpath_user', JSON.stringify(user));
  
  return token;
};

export const validateSession = (token: string): WarehouseUser | null => {
  if (!currentSession || currentSession.token !== token) {
    return null;
  }
  
  return getCurrentUser(currentSession.userId);
};

export const destroySession = (): void => {
  currentSession = null;
  localStorage.removeItem('clearpath_session');
  localStorage.removeItem('clearpath_user');
};

export const getStoredSession = (): WarehouseUser | null => {
  try {
    const storedUser = localStorage.getItem('clearpath_user');
    const storedSession = localStorage.getItem('clearpath_session');
    
    if (storedUser && storedSession) {
      const user = JSON.parse(storedUser);
      const session = JSON.parse(storedSession);
      currentSession = session;
      return user;
    }
  } catch (error) {
    console.error('Error retrieving stored session:', error);
  }
  
  return null;
};

// Initialize with sample users
if (users.length === 0) {
  generateSampleUsers();
}