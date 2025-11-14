import { useState, useEffect } from 'react';
import { X, Edit2, Trash2, Folder } from 'lucide-react';
import type { FlashcardGroup } from '@/types/flashcard';
import { flashcardService } from '@/services/flashcard';
import { Icon } from '@/components/ui/icon';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface GroupManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupsChanged?: () => void;
}

export function GroupManageModal({ isOpen, onClose, onGroupsChanged }: GroupManageModalProps) {
  const [groups, setGroups] = useState<FlashcardGroup[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingGroup, setEditingGroup] = useState<FlashcardGroup | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadGroups();
    }
  }, [isOpen]);

  const loadGroups = async () => {
    try {
      const allGroups = await flashcardService.getAllGroups();
      setGroups(allGroups);
    } catch (error) {
      console.error('Failed to load groups:', error);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      alert('请输入分组名称');
      return;
    }

    try {
      await flashcardService.createGroup(formData.name, {
        description: formData.description || undefined,
      });

      setFormData({ name: '', description: '' });
      setIsEditing(false);
      await loadGroups();
      onGroupsChanged?.();
    } catch (error) {
      console.error('Failed to create group:', error);
      alert('创建分组失败');
    }
  };

  const handleUpdate = async () => {
    if (!editingGroup || !formData.name.trim()) {
      alert('请输入分组名称');
      return;
    }

    try {
      await flashcardService.updateGroup(editingGroup.id, {
        name: formData.name,
        description: formData.description || undefined,
      });

      setFormData({ name: '', description: '' });
      setIsEditing(false);
      setEditingGroup(null);
      await loadGroups();
      onGroupsChanged?.();
    } catch (error) {
      console.error('Failed to update group:', error);
      alert('更新分组失败');
    }
  };

  const handleDelete = async (group: FlashcardGroup) => {
    if (group.id === 'default') {
      alert('默认分组不能删除');
      return;
    }

    if (!confirm(`确定要删除分组「${group.name}」吗？\n该分组的卡片将移动到默认分组。`)) {
      return;
    }

    try {
      await flashcardService.deleteGroup(group.id);
      await loadGroups();
      onGroupsChanged?.();
    } catch (error) {
      console.error('Failed to delete group:', error);
      alert('删除分组失败');
    }
  };

  const startEdit = (group: FlashcardGroup) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || '',
    });
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setEditingGroup(null);
    setFormData({ name: '', description: '' });
    setIsEditing(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGroup) {
      handleUpdate();
    } else {
      handleCreate();
    }
  };

  if (!isOpen) return null;

  return (
    <TooltipProvider>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
        <div
          className="bg-card border border-border rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">分组管理</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-accent rounded transition-colors"
          >
            <Icon icon={X} size="sm" className="text-muted-foreground" />
          </button>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-auto p-4">
          {/* 创建/编辑表单 */}
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <h3 className="text-sm font-medium mb-3">
              {editingGroup ? '编辑分组' : '创建新分组'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">分组名称 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如：工作、生活、考试..."
                  className="w-full px-3 py-2 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">描述（可选）</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="简要描述这个分组..."
                  className="w-full px-3 py-2 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground text-sm rounded-md hover:opacity-90 transition-opacity"
                >
                  {editingGroup ? '更新' : '创建'}
                </button>
                {isEditing && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-4 py-2 bg-muted text-muted-foreground text-sm rounded-md hover:bg-accent transition-colors"
                  >
                    取消
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* 分组列表 */}
          <div>
            <h3 className="text-sm font-medium mb-3">所有分组 ({groups.length})</h3>
            <div className="space-y-2">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-accent transition-colors"
                >
                  {/* 分组信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon icon={Folder} size="xs" className="text-muted-foreground flex-shrink-0" />
                      <h4 className="text-sm font-medium text-foreground truncate">
                        {group.name}
                      </h4>
                      {group.id === 'default' && (
                        <span className="text-xs text-muted-foreground">(默认)</span>
                      )}
                    </div>
                    {group.description && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {group.description}
                      </p>
                    )}
                  </div>

                  {/* 卡片数量 */}
                  <span className="text-sm text-muted-foreground flex-shrink-0">
                    {group.cardCount} 张
                  </span>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => startEdit(group)}
                          className="p-1.5 hover:bg-accent rounded transition-colors"
                        >
                          <Icon icon={Edit2} size="xs" className="text-muted-foreground" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>编辑</p>
                      </TooltipContent>
                    </Tooltip>
                    {group.id !== 'default' && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleDelete(group)}
                            className="p-1.5 hover:bg-destructive/10 rounded transition-colors"
                          >
                            <Icon icon={Trash2} size="xs" className="text-destructive" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>删除</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
