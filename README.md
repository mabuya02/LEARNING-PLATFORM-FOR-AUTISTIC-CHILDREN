# Learning Platform for Autistic Children

A comprehensive learning platform designed specifically for autistic children, featuring interactive modules, progress tracking, and multi-role dashboards for admins, educators, parents, and children.

## 🌟 Features

### User Roles
- **Admin Dashboard**: Complete system management, user CRUD operations, analytics
- **Educator Dashboard**: Monitor assigned children, track progress
- **Parent Dashboard**: View child's learning progress and achievements
- **Child Interface**: Interactive learning modules with gamification

### Learning Modules
- 🎨 Color Learning
- 🔢 Number Counting
- 🔷 Shape Sorting
- 🐾 Animal Sounds
- 📏 Big and Small (Size Concepts)

### Admin Features
- User management (Create, Read, Update, Delete all user types)
- **Enhanced User Creation**:
  - Parent-child linking during user creation
  - Educator assignment to children
  - Role-specific relationship management
- **Temporary Password Workflow**:
  - Automatic email with temporary password
  - Forced password reset on first login
  - Secure password requirements enforcement
- Complete user deletion (profile + authentication)
- System analytics and engagement tracking
- Module overview and difficulty management
- Real-time progress monitoring

📖 **See [Enhanced User Management Guide](./ENHANCED-USER-MANAGEMENT.md) for detailed documentation**  
🧪 **See [Quick Testing Guide](./QUICK-TESTING-GUIDE.md) for testing instructions**

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Git
- Homebrew (for macOS, to install Supabase CLI)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mabuya02/LEARNING-PLATFORM-FOR-AUTISTIC-CHILDREN.git
   cd LEARNING-PLATFORM-FOR-AUTISTIC-CHILDREN
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```bash
   VITE_SUPABASE_URL=https://wilkdfssyqrqbwvfkykl.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
   
   ⚠️ **DO NOT** add the service role key to `.env` - it should only be used server-side!

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   
   Open your browser and navigate to `http://localhost:5173`

## 🔧 Supabase Setup

### Database Setup

1. **Create a Supabase Project**
   - Go to https://supabase.com
   - Create a new project
   - Note your project URL and keys

2. **Run the Database Schema**
   
   Execute the SQL schema in Supabase SQL Editor:
   ```bash
   # Use the supabase-schema.sql file in the project root
   ```

3. **Create Admin User**
   
   Run the admin user creation script:
   ```sql
   -- See create-admin-user.sql for the complete script
   INSERT INTO profiles (id, email, name, role)
   VALUES (
     'your-auth-user-id',
     'admin@example.com',
     'Admin User',
     'admin'
   );
   ```

4. **Disable RLS for Development** (Optional)
   
   For easier development, you can temporarily disable RLS:
   ```bash
   # See disable-rls-children.sql
   ```

### Edge Function Setup (Required for User Deletion)

The platform uses a Supabase Edge Function to securely delete users from authentication.

1. **Install Supabase CLI**
   
   **macOS:**
   ```bash
   brew install supabase/tap/supabase
   ```
   
   **Windows/Linux:**
   See https://supabase.com/docs/guides/cli/getting-started

2. **Login to Supabase**
   ```bash
   supabase login
   ```

3. **Link your project**
   ```bash
   supabase link --project-ref wilkdfssyqrqbwvfkykl
   ```

4. **Deploy the Edge Function**
   ```bash
   supabase functions deploy delete-auth-user
   ```

5. **Set the service role key as a secret**
   ```bash
   supabase secrets set SERVICE_ROLE_KEY=your-service-role-key-here
   ```

6. **Verify deployment**
   ```bash
   supabase functions list
   ```
   
   You should see `delete-auth-user` with status `ACTIVE`

### Verify Edge Function Logs

To check if the function is working:
```bash
supabase functions logs delete-auth-user
```

## 👤 Default Admin Account

**Email:** mainamanasseh02@gmail.com  
**Password:** MainAdmin123!

⚠️ **Change this password after first login!**

## 🎮 Testing the Application

### Test User Management

1. Login as admin
2. Go to **User Management** tab
3. Test CRUD operations:
   - **Create**: Add a new user (child, parent, educator)
   - **Read**: View all users in the table
   - **Update**: Click edit icon to modify user details
   - **Delete**: Click trash icon to delete user (requires confirmation)

### Test Learning Modules

1. Login as a child user
2. Select a learning module
3. Complete activities
4. Check progress tracking

### Test Analytics

1. Login as admin or educator
2. View system analytics
3. Check engagement metrics
4. Monitor user progress

## 🏗️ Project Structure

```
.
├── src/
│   ├── components/
│   │   ├── AdminDashboard.tsx       # Admin interface
│   │   ├── EducatorDashboard.tsx    # Educator interface
│   │   ├── ParentDashboard.tsx      # Parent interface
│   │   ├── ChildInterface.tsx       # Child learning interface
│   │   ├── AuthScreen.tsx           # Login screen
│   │   ├── learning-modules/        # Interactive learning modules
│   │   └── ui/                      # Reusable UI components
│   ├── services/
│   │   ├── adminService.ts          # Admin CRUD operations
│   │   └── authService.ts           # Authentication service
│   ├── lib/
│   │   └── supabase.ts              # Supabase client
│   ├── App.tsx                      # Main application
│   └── main.tsx                     # Entry point
├── supabase/
│   └── functions/
│       └── delete-auth-user/        # Edge function for user deletion
├── supabase-schema.sql              # Database schema
├── create-admin-user.sql            # Admin user creation script
├── .env                             # Environment variables (not committed)
└── package.json                     # Dependencies
```

## 🔒 Security Features

### Authentication
- Secure Supabase authentication
- Role-based access control (RBAC)
- JWT token validation

### Data Protection
- Row Level Security (RLS) policies
- Service role key stored server-side only
- Edge Functions for privileged operations
- Input validation and sanitization

### User Deletion
- Comprehensive deletion of all user data:
  - Profile records
  - Progress data
  - Session history
  - Module completions
  - Authentication account
- Admin-only operation with confirmation dialog
- Cascading deletes for related records

## 📚 Key Technologies

- **Frontend**: React 18.3.1 + TypeScript + Vite
- **UI Library**: Radix UI + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **State Management**: React Hooks
- **Notifications**: Sonner (Toast notifications)
- **Icons**: Lucide React

## 🛠️ Development Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🐛 Troubleshooting

### Common Issues

**1. "Missing Supabase environment variables"**
- Ensure `.env` file exists with correct values
- Restart dev server after adding/changing env vars

**2. Authentication fails**
- Check Supabase project URL and anon key
- Verify user exists in Supabase Authentication

**3. Edge Function not working**
- Verify function is deployed: `supabase functions list`
- Check logs: `supabase functions logs delete-auth-user`
- Ensure SERVICE_ROLE_KEY secret is set

**4. Delete user fails**
- User must be admin
- Edge function must be deployed
- Check browser console for errors

**5. RLS errors**
- Check RLS policies in Supabase Dashboard
- Temporarily disable RLS for development (see disable-rls-children.sql)

### Getting Help

- Check the documentation files:
  - `DELETE-USER-FEATURE.md` - User deletion implementation
  - `DEPLOY-EDGE-FUNCTION.md` - Edge function deployment guide
  - `SECURITY-WARNING.md` - Security best practices
  - `SECURE-DELETE-IMPLEMENTATION.md` - Secure deletion details

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

### Deploy to Netlify

1. Push your code to GitHub
2. Connect your repository to Netlify
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Add environment variables
6. Deploy!

### Important: Post-Deployment

- Ensure Edge Functions are deployed in Supabase
- Update CORS settings if needed
- Test user deletion functionality
- Enable RLS policies for production

## 📋 Feature Roadmap

- [ ] Password reset functionality
- [ ] Email notifications
- [ ] Soft delete (mark as inactive)
- [ ] Bulk user operations
- [ ] Export reports (CSV, PDF)
- [ ] More learning modules
- [ ] Multilingual support
- [ ] Mobile app version

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- **Original Design**: [Figma Design](https://www.figma.com/design/ShosrUgJUHbsrJva774noN/Learning-Platform-for-Autistic-Children)
- **Development**: Manasseh Maina

## 🙏 Acknowledgments

- Supabase for backend infrastructure
- Radix UI for accessible components
- The autism community for inspiration and feedback

---

**Made with ❤️ for autistic children and their families**
  