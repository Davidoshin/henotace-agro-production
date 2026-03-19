import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiGet } from '@/lib/api';

// Fallback subject choices (used if API fails)
const FALLBACK_SUBJECT_CHOICES = [
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'english', label: 'English' },
  { value: 'physics', label: 'Physics' },
  { value: 'chemistry', label: 'Chemistry' },
  { value: 'biology', label: 'Biology' },
  { value: 'economics', label: 'Economics' },
  { value: 'government', label: 'Government' },
  { value: 'literature', label: 'Literature' },
  { value: 'geography', label: 'Geography' },
  { value: 'history', label: 'History' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'commerce', label: 'Commerce' },
  { value: 'accounting', label: 'Accounting' },
  { value: 'further_maths', label: 'Further Mathematics' },
  { value: 'crs', label: 'Christian Religious Studies' },
  { value: 'irs', label: 'Islamic Religious Studies' },
  { value: 'civic_education', label: 'Civic Education' },
  { value: 'social_studies', label: 'Social Studies' },
  { value: 'basic_science', label: 'Basic Science' },
  { value: 'basic_technology', label: 'Basic Technology' },
  { value: 'home_economics', label: 'Home Economics' },
  { value: 'business_studies', label: 'Business Studies' },
  { value: 'computer_studies', label: 'Computer Studies' },
];

interface SubjectSelectProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function SubjectSelect({
  value,
  onChange,
  label = 'Subject',
  placeholder = 'Search or select a subject...',
  required = false,
  className = '',
}: SubjectSelectProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [subjects, setSubjects] = useState<Array<{value: string, label: string}>>(FALLBACK_SUBJECT_CHOICES);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load subjects from API - use teacher's assigned subjects endpoint
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        // Try teacher's assigned subjects endpoint first (for teachers)
        const data = await apiGet('school/teacher/subjects/') as any;
        if (data && data.subjects && Array.isArray(data.subjects)) {
          setSubjects(data.subjects.map((s: any) => ({
            value: s.code || s.name?.toLowerCase().replace(/\s+/g, '_') || s.name,
            label: s.name
          })));
        } else {
          // Fallback to general subjects endpoint if teacher endpoint doesn't work
          const fallbackData = await apiGet('subjects/') as any;
          if (fallbackData.success && fallbackData.subjects) {
            setSubjects(fallbackData.subjects.map((s: any) => ({
              value: s.code,
              label: s.name
            })));
          }
        }
      } catch (e) {
        console.warn('Failed to load subjects from API, using fallback:', e);
        // Keep fallback subjects
      }
    };
    loadSubjects();
  }, []);

  // Filter subjects based on search query
  const filteredSubjects = subjects.filter((subject) =>
    subject.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subject.value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get selected subject label
  const selectedSubject = subjects.find((s) => s.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (subjectValue: string) => {
    onChange(subjectValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = () => {
    onChange('');
    setSearchQuery('');
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <Label htmlFor="subject-select">
          {label} {required && '*'}
        </Label>
      )}
      <div className="relative mt-2">
        <Input
          id="subject-select"
          type="text"
          value={selectedSubject ? selectedSubject.label : searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
            if (!e.target.value) {
              onChange('');
            }
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pr-8"
        />
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredSubjects.length > 0 ? (
            filteredSubjects.map((subject) => (
              <div
                key={subject.value}
                onClick={() => handleSelect(subject.value)}
                className={`p-2 cursor-pointer hover:bg-gray-100 ${
                  value === subject.value ? 'bg-blue-50 font-semibold' : ''
                }`}
              >
                {subject.label}
              </div>
            ))
          ) : (
            <div className="p-2 text-sm text-gray-500">No subjects found</div>
          )}
        </div>
      )}
    </div>
  );
}

