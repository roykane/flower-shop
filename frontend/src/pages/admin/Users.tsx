import { useState, useEffect } from 'react';
import { HiOutlineSearch, HiOutlineMail, HiOutlineBan, HiOutlineCheck } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { User } from '@/types';
import { usersAPI } from '@/utils/api';

interface UserWithStats extends User {
  orders?: number;
  totalSpent?: number;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await usersAPI.getAll({ limit: 100 });
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Không thể tải danh sách người dùng');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      const response = await usersAPI.update(userId, { role: newRole });
      if (response.data.success) {
        setUsers(users.map(u =>
          u._id === userId ? { ...u, role: newRole as 'user' | 'admin' } : u
        ));
        toast.success(`Đã thay đổi vai trò thành ${newRole === 'admin' ? 'Quản trị viên' : 'Khách hàng'}`);
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Không thể thay đổi vai trò người dùng');
    }
  };

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    customers: users.filter(u => u.role === 'user').length,
    newThisMonth: users.filter(u => {
      if (!u.createdAt) return false;
      const createdDate = new Date(u.createdAt);
      const now = new Date();
      return createdDate.getMonth() === now.getMonth() &&
             createdDate.getFullYear() === now.getFullYear();
    }).length,
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="mb-8">
          <div className="h-8 bg-neutral-200 rounded w-48 mb-2" />
          <div className="h-4 bg-neutral-200 rounded w-64" />
        </div>
        <div className="grid sm:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="h-4 bg-neutral-200 rounded w-24 mb-2" />
              <div className="h-8 bg-neutral-200 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-heading">Quản Lý Người Dùng</h1>
        <p className="text-neutral-500">Quản lý tài khoản người dùng</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-neutral-500">Tổng Người Dùng</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-neutral-500">Quản Trị Viên</p>
          <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-neutral-500">Khách Hàng</p>
          <p className="text-2xl font-bold text-blue-600">{stats.customers}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-neutral-500">Mới Trong Tháng</p>
          <p className="text-2xl font-bold text-green-600">{stats.newThisMonth}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm người dùng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="input w-auto"
          >
            <option value="all">Tất Cả Vai Trò</option>
            <option value="user">Khách Hàng</option>
            <option value="admin">Quản Trị Viên</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-neutral-500">Người Dùng</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-neutral-500">Vai Trò</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-neutral-500">Ngày Tham Gia</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-neutral-500">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary font-medium">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-neutral-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-500">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="p-2 hover:bg-neutral-100 rounded-lg"
                          title="Xem Chi Tiết"
                        >
                          <HiOutlineMail className="w-5 h-5 text-neutral-500" />
                        </button>
                        <button
                          onClick={() => handleToggleRole(user._id, user.role)}
                          className="p-2 hover:bg-neutral-100 rounded-lg"
                          title={user.role === 'admin' ? 'Hủy Quyền Admin' : 'Cấp Quyền Admin'}
                        >
                          {user.role === 'admin' ? (
                            <HiOutlineBan className="w-5 h-5 text-red-500" />
                          ) : (
                            <HiOutlineCheck className="w-5 h-5 text-green-500" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-neutral-500">
              {users.length === 0 ? 'Chưa có người dùng nào' : 'Không tìm thấy người dùng nào'}
            </p>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-xl">Chi Tiết Người Dùng</h2>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-neutral-500 hover:text-neutral-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-2xl text-primary font-medium">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-heading text-lg">{selectedUser.name}</h3>
                  <p className="text-neutral-500">{selectedUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-neutral-50 rounded-lg p-3">
                  <p className="text-sm text-neutral-500">Vai Trò</p>
                  <p className="font-medium">
                    {selectedUser.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}
                  </p>
                </div>
                <div className="bg-neutral-50 rounded-lg p-3">
                  <p className="text-sm text-neutral-500">Ngày Tham Gia</p>
                  <p className="font-medium">
                    {selectedUser.createdAt
                      ? new Date(selectedUser.createdAt).toLocaleDateString('vi-VN')
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    window.location.href = `mailto:${selectedUser.email}`;
                  }}
                  className="btn btn-secondary flex-1 flex items-center justify-center gap-2"
                >
                  <HiOutlineMail className="w-5 h-5" />
                  Gửi Email
                </button>
                <button
                  onClick={() => {
                    handleToggleRole(selectedUser._id, selectedUser.role);
                    setSelectedUser(null);
                  }}
                  className="btn btn-primary flex-1"
                >
                  {selectedUser.role === 'admin' ? 'Hủy Quyền Admin' : 'Cấp Quyền Admin'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
