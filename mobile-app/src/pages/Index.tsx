import { useState } from "react";
import { subjects, questions } from "@/data/questions";
import { SubjectCard } from "@/components/SubjectCard";
import { ExamInterface } from "@/components/ExamInterface";
import { ResultsPage } from "@/components/ResultsPage";
import { MultiSubjectSelection } from "@/components/MultiSubjectSelection";
import { GraduationCap, BookOpen, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Screen = "subjects" | "exam" | "results" | "cbt-practice";

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>("subjects");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [examAnswers, setExamAnswers] = useState<Record<number, number>>({});
  const [timeSpent, setTimeSpent] = useState(0);
  const [showAllSubjects, setShowAllSubjects] = useState(false);
  const [currentQuestions, setCurrentQuestions] = useState<any[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isCBTPractice, setIsCBTPractice] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Function to randomly select 50 questions from the question bank
  const getRandomQuestions = (allQuestions: any[]) => {
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 50);
  };

  const handleStartExam = (subjectId: string) => {
    setSelectedSubject(subjectId);
    setIsCBTPractice(false);
    const allQuestionsForSubject = questions[subjectId] || [];
    const randomQuestions = getRandomQuestions(allQuestionsForSubject);
    setCurrentQuestions(randomQuestions);
    setCurrentScreen("exam");
    setExamAnswers({});
    setTimeSpent(0);
  };

  const handleStartCBTPractice = (subjectIds: string[]) => {
    setSelectedSubjects(subjectIds);
    setIsCBTPractice(true);
    
    // Combine 50 questions from each subject in order
    const combinedQuestions: any[] = [];
    subjectIds.forEach((subjectId) => {
      const allQuestionsForSubject = questions[subjectId] || [];
      const randomQuestions = getRandomQuestions(allQuestionsForSubject);
      combinedQuestions.push(...randomQuestions);
    });
    
    setCurrentQuestions(combinedQuestions);
    setCurrentScreen("exam");
    setExamAnswers({});
    setTimeSpent(0);
  };

  const handleExamComplete = (answers: Record<number, number>, time: number) => {
    setExamAnswers(answers);
    setTimeSpent(time);
    setCurrentScreen("results");
  };

  const handleRetry = () => {
    setExamAnswers({});
    setTimeSpent(0);
    setCurrentScreen("exam");
  };

  const handleBackToHome = () => {
    setSelectedSubject("");
    setSelectedSubjects([]);
    setExamAnswers({});
    setTimeSpent(0);
    setCurrentQuestions([]);
    setIsCBTPractice(false);
    setCurrentScreen("subjects");
  };

  const currentSubject = subjects.find((s) => s.id === selectedSubject);
  
  // Filter subjects based on search query
  const filteredSubjects = subjects.filter((subject) =>
    subject.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const displayedSubjects = showAllSubjects 
    ? filteredSubjects 
    : filteredSubjects.slice(0, 6);

  if (currentScreen === "cbt-practice") {
    return (
      <MultiSubjectSelection
        onStart={handleStartCBTPractice}
        onBack={handleBackToHome}
      />
    );
  }

  if (currentScreen === "exam") {
    const examTitle = isCBTPractice 
      ? "CBT Practice" 
      : currentSubject?.name || "";
    const examDuration = isCBTPractice 
      ? selectedSubjects.length * 30 
      : currentSubject?.duration || 30;

    return (
      <ExamInterface
        questions={currentQuestions}
        subjectName={examTitle}
        duration={examDuration}
        onComplete={handleExamComplete}
        onExit={handleBackToHome}
        isCBTPractice={isCBTPractice}
        selectedSubjects={isCBTPractice ? selectedSubjects : undefined}
      />
    );
  }

  if (currentScreen === "results") {
    const resultsTitle = isCBTPractice 
      ? "CBT Practice" 
      : currentSubject?.name || "";

    return (
      <ResultsPage
        questions={currentQuestions}
        answers={examAnswers}
        timeSpent={timeSpent}
        subjectName={resultsTitle}
        onRetry={handleRetry}
        onHome={handleBackToHome}
        isCBTPractice={isCBTPractice}
        selectedSubjects={isCBTPractice ? selectedSubjects : undefined}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-card-foreground">WAEC CBT Practice</h1>
              <p className="text-sm text-muted-foreground">
                West African Examinations Council Computer Based Testing
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* CBT Practice Card */}
          <Card className="p-6 mb-8 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary text-primary-foreground shrink-0">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">CBT Practice Mode</h3>
                  <p className="text-muted-foreground">
                    Select multiple subjects for a comprehensive practice session. 
                    Combine subjects to create longer exams with questions arranged by your selection order.
                  </p>
                </div>
              </div>
              <Button 
                size="lg" 
                onClick={() => setCurrentScreen("cbt-practice")}
                className="shrink-0"
              >
                Start CBT Practice
              </Button>
            </div>
          </Card>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-3">
              Or Select a Single Subject
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
              Choose a subject to begin your WAEC CBT practice examination. 
              Each exam contains 50 randomly selected questions with a time limit of 30 minutes.
            </p>
            
            {/* Search Input */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder="Search subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedSubjects.map((subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                onStart={handleStartExam}
              />
            ))}
          </div>

          {!showAllSubjects && filteredSubjects.length > 6 && (
            <div className="text-center mt-8">
              <button
                onClick={() => setShowAllSubjects(true)}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                Show More Subjects ({filteredSubjects.length - 6} more)
              </button>
            </div>
          )}
          
          {searchQuery && filteredSubjects.length === 0 && (
            <div className="text-center mt-8 text-muted-foreground">
              No subjects found matching "{searchQuery}"
            </div>
          )}

          {/* Info Section */}
          <div className="mt-12 p-6 bg-primary-light rounded-lg border border-primary/20">
            <h3 className="font-semibold text-foreground mb-2">Exam Instructions</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Each exam session has 50 randomly selected multiple-choice questions</li>
              <li>• You have 30 minutes to complete each exam</li>
              <li>• Click on an option to select your answer</li>
              <li>• Use the question palette to navigate between questions</li>
              <li>• Flag questions you want to review later</li>
              <li>• Submit your exam when complete or when time runs out</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>
            © 2025 WAEC CBT Practice Platform by{" "}
            <a 
              href="https://henotaceai.ng" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              henotaceai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
