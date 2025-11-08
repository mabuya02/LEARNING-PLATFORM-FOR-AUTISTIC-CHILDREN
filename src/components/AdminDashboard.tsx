import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { 
  AlertDialog, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from './ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { User, LearningModule, ProgressData, UserRole } from '../App';
import { 
  Shield, 
  Users, 
  BookOpen, 
  TrendingUp, 
  LogOut, 
  Edit, 
  Trash2,
  UserPlus,
  GraduationCap,
  Baby,
  Heart
} from 'lucide-react';

interface AdminDashboardProps {
  user: User;
  allUsers: User[];
  allModules: LearningModule[];
  allProgress: ProgressData[];
  onUpdateUser: (user: User) => void | Promise<void>;
  onDeleteUser: (userId: string) => void | Promise<void>;
  onAddUser: (user: Omit<User, 'id'>) => User | Promise<User>;
  onLogout: () => void;
}

export function AdminDashboard({ 
  user, 
  allUsers, 
  allModules, 
  allProgress, 
  onUpdateUser, 
  onDeleteUser, 
  onAddUser, 
  onLogout 
}: AdminDashboardProps) {
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'child' as UserRole
  });

  const handleCreateUser = async () => {
    if (!newUser.name.trim() || !newUser.email.trim()) return;

    const userData: any = {
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    };

    try {
      await onAddUser(userData);
      setNewUser({ name: '', email: '', role: 'child' });
      setIsCreatingUser(false);
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      await onUpdateUser(editingUser);
      setEditingUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser || isDeleting) return; // Prevent double deletion
    
    setIsDeleting(true);
    try {
      await onDeleteUser(deletingUser.id);
      setDeletingUser(null); // Close the dialog
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setIsDeleting(false);
      setDeletingUser(null); // Close the dialog
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'educator': return <GraduationCap className="w-4 h-4" />;
      case 'parent': return <Heart className="w-4 h-4" />;
      case 'child': return <Baby className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'educator': return 'bg-blue-100 text-blue-800';
      case 'parent': return 'bg-green-100 text-green-800';
      case 'child': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyStats = () => {
    const easy = allModules.filter(m => m.difficulty === 'easy').length;
    const medium = allModules.filter(m => m.difficulty === 'medium').length;
    const hard = allModules.filter(m => m.difficulty === 'hard').length;
    return { easy, medium, hard };
  };

  const getUserStats = () => {
    const educators = allUsers.filter(u => u.role === 'educator').length;
    const parents = allUsers.filter(u => u.role === 'parent').length;
    const children = allUsers.filter(u => u.role === 'child').length;
    const admins = allUsers.filter(u => u.role === 'admin').length;
    return { educators, parents, children, admins };
  };

  const getEngagementStats = () => {
    const totalSessions = allProgress.length;
    const highEngagement = allProgress.filter(p => p.engagementLevel === 'high').length;
    const avgCompletionRate = allProgress.reduce((sum, p) => sum + p.completionRate, 0) / totalSessions || 0;
    return { totalSessions, highEngagement, avgCompletionRate: Math.round(avgCompletionRate) };
  };

  const userStats = getUserStats();
  const difficultyStats = getDifficultyStats();
  const engagementStats = getEngagementStats();
  const children = allUsers.filter(u => u.role === 'child');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">System Administration Panel - {user.name}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Users className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl">{allUsers.length}</p>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <BookOpen className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl">{allModules.length}</p>
                  <p className="text-sm text-muted-foreground">Learning Modules</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-2xl">{engagementStats.totalSessions}</p>
                  <p className="text-sm text-muted-foreground">Learning Sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Heart className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-2xl">{engagementStats.avgCompletionRate}%</p>
                  <p className="text-sm text-muted-foreground">Avg Completion</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="modules">Module Overview</TabsTrigger>
            <TabsTrigger value="analytics">System Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl">User Management</h2>
              <Dialog open={isCreatingUser} onOpenChange={setIsCreatingUser}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={newUser.name}
                        onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select value={newUser.role} onValueChange={(value: UserRole) => setNewUser(prev => ({ ...prev, role: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="child">Child</SelectItem>
                          <SelectItem value="parent">Parent</SelectItem>
                          <SelectItem value="educator">Educator</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                      <p className="text-sm text-blue-800">
                        📧 <strong>Email Notification:</strong> The user will receive an email with a temporary password. They must reset it on first login.
                      </p>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button variant="outline" onClick={() => setIsCreatingUser(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateUser}>
                        Create User
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Linked Child</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsers.map((userData) => (
                      <TableRow key={userData.id}>
                        <TableCell className="flex items-center space-x-2">
                          {getRoleIcon(userData.role)}
                          <span>{userData.name}</span>
                        </TableCell>
                        <TableCell>{userData.email}</TableCell>
                        <TableCell>
                          <Badge className={getRoleColor(userData.role)}>
                            {userData.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {userData.childId ? 
                            allUsers.find(u => u.id === userData.childId)?.name || 'Unknown' 
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingUser(userData)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {userData.id !== user.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => setDeletingUser(userData)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="modules" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Learning Modules by Difficulty</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <h3 className="text-lg mb-2">Easy</h3>
                    <p className="text-3xl text-green-600">{difficultyStats.easy}</p>
                    <p className="text-sm text-muted-foreground">modules</p>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg text-center">
                    <h3 className="text-lg mb-2">Medium</h3>
                    <p className="text-3xl text-yellow-600">{difficultyStats.medium}</p>
                    <p className="text-sm text-muted-foreground">modules</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg text-center">
                    <h3 className="text-lg mb-2">Hard</h3>
                    <p className="text-3xl text-red-600">{difficultyStats.hard}</p>
                    <p className="text-sm text-muted-foreground">modules</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4>Recent Modules</h4>
                  {allModules.slice(0, 5).map((module) => (
                    <div key={module.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div>
                        <h5>{module.title}</h5>
                        <p className="text-sm text-muted-foreground">{module.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={
                          module.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                          module.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {module.difficulty}
                        </Badge>
                        <Badge variant="outline">{module.duration}min</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>User Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-2">
                        <Shield className="w-4 h-4 text-purple-500" />
                        <span>Admins</span>
                      </span>
                      <span>{userStats.admins}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-2">
                        <GraduationCap className="w-4 h-4 text-blue-500" />
                        <span>Educators</span>
                      </span>
                      <span>{userStats.educators}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-2">
                        <Heart className="w-4 h-4 text-green-500" />
                        <span>Parents</span>
                      </span>
                      <span>{userStats.parents}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-2">
                        <Baby className="w-4 h-4 text-orange-500" />
                        <span>Children</span>
                      </span>
                      <span>{userStats.children}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Engagement Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="text-lg mb-2">High Engagement</h4>
                      <p className="text-2xl text-blue-600">{engagementStats.highEngagement}</p>
                      <p className="text-sm text-muted-foreground">out of {engagementStats.totalSessions} sessions</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="text-lg mb-2">Average Completion</h4>
                      <p className="text-2xl text-green-600">{engagementStats.avgCompletionRate}%</p>
                      <p className="text-sm text-muted-foreground">across all modules</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser(prev => prev ? { ...prev, email: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select 
                  value={editingUser.role} 
                  onValueChange={(value: UserRole) => setEditingUser(prev => prev ? { ...prev, role: value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="child">Child</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="educator">Educator</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editingUser.role === 'parent' && (
                <div className="space-y-2">
                  <Label>Child</Label>
                  <Select 
                    value={editingUser.childId || ''} 
                    onValueChange={(value) => setEditingUser(prev => prev ? { ...prev, childId: value } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select child" />
                    </SelectTrigger>
                    <SelectContent>
                      {children.map((child) => (
                        <SelectItem key={child.id} value={child.id}>
                          {child.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setEditingUser(null)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateUser}>
                  Update User
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User - Permanent Action</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p className="font-semibold text-red-600">
                  ⚠️ This action cannot be undone!
                </p>
                <p>
                  You are about to permanently delete <span className="font-semibold">{deletingUser?.name}</span> ({deletingUser?.email}).
                </p>
                <p className="text-sm">
                  This will delete:
                </p>
                <ul className="text-sm list-disc list-inside space-y-1 pl-2">
                  <li>User profile and account</li>
                  <li>All learning progress records</li>
                  <li>All session history</li>
                  <li>All module completions</li>
                  <li>All analytics data</li>
                  {deletingUser?.role === 'parent' && (
                    <li className="text-red-600 font-semibold">All associated children and their data</li>
                  )}
                </ul>
                <p className="font-semibold pt-2">
                  Are you absolutely sure you want to continue?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row justify-end gap-2 mt-4">
            <AlertDialogCancel className="mt-0" disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              onClick={() => {
                handleDeleteUser();
              }}
              disabled={isDeleting}
              style={{ 
                backgroundColor: '#dc2626', 
                color: 'white',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? 'Deleting...' : 'Yes, Delete Permanently'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}