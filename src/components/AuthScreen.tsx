import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { User, UserRole, UserCredentials } from '../App';
import { BookOpen, Heart, Star, Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface AuthScreenProps {
  onLogin: (credentials: UserCredentials) => Promise<User | null>;
  mockCredentials: UserCredentials[];
}

export function AuthScreen({ onLogin, mockCredentials }: AuthScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('child');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showDemo, setShowDemo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setError('');

    const credentials: UserCredentials = {
      email: email.trim(),
      password: password.trim(),
      role
    };

    try {
      const user = await onLogin(credentials);
      if (!user) {
        setError('Invalid credentials. Please check your email and password.');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (demoCredentials: UserCredentials) => {
    setEmail(demoCredentials.email);
    setPassword(demoCredentials.password);
    setRole(demoCredentials.role);
    setError('');
    setIsLoading(true);
    
    try {
      // Auto login with demo credentials
      const user = await onLogin(demoCredentials);
      if (!user) {
        setError('Demo login failed');
      }
    } catch (err) {
      setError('Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (roleType: UserRole) => {
    switch (roleType) {
      case 'admin':
        return <Shield className="w-8 h-8" />;
      case 'educator':
        return <BookOpen className="w-8 h-8" />;
      case 'parent':
        return <Heart className="w-8 h-8" />;
      case 'child':
        return <Star className="w-8 h-8" />;
    }
  };

  const getRoleColor = (roleType: UserRole) => {
    switch (roleType) {
      case 'admin':
        return 'bg-purple-500';
      case 'educator':
        return 'bg-blue-500';
      case 'parent':
        return 'bg-green-500';
      case 'child':
        return 'bg-yellow-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Learning Platform</CardTitle>
          <p className="text-muted-foreground">Welcome to our inclusive learning space</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              className="text-lg py-3"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="text-lg py-3 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>I am a...</Label>
            <Select value={role} onValueChange={(value: UserRole) => setRole(value)}>
              <SelectTrigger className="py-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="child">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>Child - I want to learn and play!</span>
                  </div>
                </SelectItem>
                <SelectItem value="parent">
                  <div className="flex items-center space-x-2">
                    <Heart className="w-4 h-4 text-green-500" />
                    <span>Parent - I want to track my child's progress</span>
                  </div>
                </SelectItem>
                <SelectItem value="educator">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-blue-500" />
                    <span>Educator - I want to create learning content</span>
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-purple-500" />
                    <span>Admin - I manage the system</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleLogin}
            disabled={!email.trim() || !password.trim() || isLoading}
            className="w-full py-3 text-lg"
            size="lg"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>

          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => setShowDemo(!showDemo)}
              className="text-sm"
              disabled={isLoading}
            >
              {showDemo ? 'Hide' : 'Show'} Demo Accounts
            </Button>
          </div>

          {showDemo && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Demo Accounts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {mockCredentials.map((cred, index) => (
                  <button
                    key={index}
                    onClick={() => handleDemoLogin(cred)}
                    className="w-full p-3 text-left bg-white rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          {getRoleIcon(cred.role)}
                          <span className="capitalize">{cred.role}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {cred.email}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Password: {cred.password}
                      </div>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}