import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { apiGet, apiPost } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Users, Calendar, CheckCircle2, XCircle } from 'lucide-react';

interface PublishingModalProps {
  open: boolean;
  onClose: () => void;
  item: any; // test or exam
  itemType: 'test' | 'exam';
  onPublished: () => void;
}

export function PublishingModal({ open, onClose, item, itemType, onPublished }: PublishingModalProps) {
  const { toast } = useToast();
  const [publishMode, setPublishMode] = useState<'all' | 'selected'>('all');
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [publishedStudents, setPublishedStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (open && item) {
      loadStudents();
      loadPublishedStudents();
    }
  }, [open, item]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      // Use the class-specific endpoint to get students
      const classId = item.school_class?.id;
      
      if (!classId) {
        toast({ title: 'No class assigned', description: 'Please assign a class to this ' + itemType, variant: 'destructive' });
        setStudents([]);
        setLoading(false);
        return;
      }
      
      // Try the teacher students endpoint with class filter
      const data = await apiGet(`school/teacher/students/`) as any;
      
      // Filter students by the class and map to expected format
      const studentsInClass = (data.students || []).filter((s: any) => 
        s.school_class?.id === classId
      );
      
      const studentsData = studentsInClass.map((s: any) => ({
        id: s.id,
        name: s.user?.name || `${s.user?.first_name || ''} ${s.user?.last_name || ''}`.trim() || s.user?.email || 'Unknown',
        email: s.user?.email || '',
      }));
      
      setStudents(studentsData);
    } catch (e: any) {
      console.error('Load students error:', e);
      toast({ title: 'Failed to load students', description: e?.message, variant: 'destructive' });
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPublishedStudents = async () => {
    try {
      const endpoint = itemType === 'test'
        ? `school/teacher/tests/${item.id}/published-students/`
        : `school/teacher/exams/${item.id}/published-students/`;
      
      const data = await apiGet(endpoint) as any;
      
      // Map to include student_id in the data
      const published = (data.published_students || []).map((ps: any) => ({
        ...ps,
        id: ps.student_id, // Use student_id for comparison
      }));
      
      setPublishedStudents(published);
    } catch (e: any) {
      // If endpoint not found, no students published yet
      console.log('No published students or endpoint not available:', e);
      setPublishedStudents([]);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const endpoint = itemType === 'test'
        ? `school/teacher/tests/${item.id}/publish/`
        : `school/teacher/exams/${item.id}/publish-to-students/`;
      
      const payload: any = {
        publish_to_all: publishMode === 'all',
        student_ids: publishMode === 'selected' ? selectedStudents : []
      };

      if (isScheduled && scheduledDate && scheduledTime) {
        const dateTime = `${scheduledDate}T${scheduledTime}:00`;
        payload.available_from = new Date(dateTime).toISOString();
      }

      const result = await apiPost(endpoint, payload) as any;
      
      toast({ 
        title: 'Published Successfully', 
        description: result.message || `Published to ${result.published_count} students`
      });
      
      onPublished();
      onClose();
      
    } catch (e: any) {
      toast({ title: 'Publishing Failed', description: e?.message, variant: 'destructive' });
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublishAll = async () => {
    if (!confirm('Unpublish for ALL students? They will lose access immediately.')) return;
    
    try {
      const endpoint = itemType === 'test'
        ? `school/teacher/tests/${item.id}/unpublish/`
        : `school/teacher/exams/${item.id}/unpublish-from-students/`;
      
      await apiPost(endpoint, { unpublish_all: true });
      
      toast({ title: 'Unpublished', description: 'All students have lost access' });
      
      loadPublishedStudents();
      
    } catch (e: any) {
      toast({ title: 'Failed', description: e?.message, variant: 'destructive' });
    }
  };

  const filteredStudents = students.filter(s => 
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const publishedStudentIds = new Set(publishedStudents.map(ps => ps.id));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Publish {itemType === 'test' ? 'Test' : 'Exam'}: {item?.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          {publishedStudents.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900 dark:text-blue-100">
                  Currently Published to {publishedStudents.length} Student(s)
                </span>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const publishedList = publishedStudents.map(ps => ps.name).join(', ');
                    alert(`Published to:\n${publishedList}`);
                  }}
                >
                  View List
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleUnpublishAll}
                  className="text-red-600 hover:text-red-700"
                >
                  Unpublish All
                </Button>
              </div>
            </div>
          )}

          {/* Publishing Options */}
          <div className="space-y-4">
            <Label>Publishing Options</Label>
            <RadioGroup value={publishMode} onValueChange={(v) => setPublishMode(v as 'all' | 'selected')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="publish-all" />
                <Label htmlFor="publish-all" className="cursor-pointer">
                  Publish to ALL students ({students.length})
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="selected" id="publish-selected" />
                <Label htmlFor="publish-selected" className="cursor-pointer">
                  Publish to SELECTED students
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Scheduled Publishing */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="schedule-publish" 
                checked={isScheduled}
                onCheckedChange={(checked) => setIsScheduled(!!checked)}
              />
              <Label htmlFor="schedule-publish" className="cursor-pointer">
                Schedule for Later (Optional)
              </Label>
            </div>
            
            {isScheduled && (
              <div className="grid grid-cols-2 gap-4 ml-6">
                <div className="space-y-2">
                  <Label htmlFor="scheduled-date">Date</Label>
                  <Input 
                    type="date" 
                    id="scheduled-date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduled-time">Time</Label>
                  <Input 
                    type="time" 
                    id="scheduled-time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Student Selection (if selected mode) */}
          {publishMode === 'selected' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Select Students ({selectedStudents.length} selected)</Label>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedStudents(filteredStudents.map(s => s.id))}
                  >
                    Select All
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedStudents([])}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              <Input 
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <div className="border rounded-lg max-h-64 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-muted-foreground">Loading students...</div>
                ) : filteredStudents.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">No students found</div>
                ) : (
                  <div className="divide-y">
                    {filteredStudents.map((student: any) => {
                      const isPublished = publishedStudentIds.has(student.id);
                      const isSelected = selectedStudents.includes(student.id);
                      
                      return (
                        <div 
                          key={student.id} 
                          className="p-3 hover:bg-muted/50 cursor-pointer flex items-center gap-3"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedStudents(prev => prev.filter(id => id !== student.id));
                            } else {
                              setSelectedStudents(prev => [...prev, student.id]);
                            }
                          }}
                        >
                          <Checkbox checked={isSelected} />
                          <div className="flex-1">
                            <div className="font-medium">{student.name}</div>
                            <div className="text-xs text-muted-foreground">{student.email}</div>
                          </div>
                          {isPublished && (
                            <Badge variant="default" className="text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Published
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handlePublish}
              disabled={publishing || (publishMode === 'selected' && selectedStudents.length === 0)}
            >
              {publishing ? 'Publishing...' : 
                publishMode === 'all' 
                  ? `Publish to All (${students.length})`
                  : `Publish to ${selectedStudents.length} Student(s)`
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

