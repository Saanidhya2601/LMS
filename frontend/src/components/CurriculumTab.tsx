import { useState } from "react";
import {
  Plus,
  GripVertical,
  FileText,
  Video,
  Trash2,
  BrainCircuit,
  X,
  PlusCircle,
} from "lucide-react";
import axios from "axios";

interface Lesson {
  id: string;
  title: string;
  content: string;
  video_url: string;
  order: number;
}

interface Module {
  id: string;
  title: string;
  order: number;
  lessons?: Lesson[];
}

interface CurriculumTabProps {
  modules: Module[];
  newModuleTitle: string;
  setNewModuleTitle: React.Dispatch<React.SetStateAction<string>>;
  isCreatingModule: boolean;
  handleCreateModule: (e: React.FormEvent) => Promise<void>;
  handleDeleteModule: (moduleId: string) => Promise<void>;
  openLessonModal: (moduleId: string) => void;
  handleDeleteLesson: (moduleId: string, lessonId: string) => Promise<void>;
}

export default function CurriculumTab({
  modules,
  newModuleTitle,
  setNewModuleTitle,
  isCreatingModule,
  handleCreateModule,
  handleDeleteModule,
  openLessonModal,
  handleDeleteLesson,
}: CurriculumTabProps) {
  // 🚀 QUIZ MODAL STATE
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [isSavingQuiz, setIsSavingQuiz] = useState(false);
  const [quizData, setQuizData] = useState({
    pass_score: 80,
    questions: [
      {
        text: "",
        options: [
          { text: "", is_correct: true },
          { text: "", is_correct: false },
        ],
      },
    ],
  });

  // 🚀 QUIZ LOGIC
  const openQuizModal = (lessonId: string) => {
    setActiveLessonId(lessonId);
    setIsQuizModalOpen(true);
  };

  const addQuestion = () => {
    setQuizData({
      ...quizData,
      questions: [
        ...quizData.questions,
        {
          text: "",
          options: [
            { text: "", is_correct: true },
            { text: "", is_correct: false },
          ],
        },
      ],
    });
  };

  const updateQuestionText = (index: number, text: string) => {
    const newQuestions = [...quizData.questions];
    newQuestions[index].text = text;
    setQuizData({ ...quizData, questions: newQuestions });
  };

  const updateOptionText = (qIndex: number, oIndex: number, text: string) => {
    const newQuestions = [...quizData.questions];
    newQuestions[qIndex].options[oIndex].text = text;
    setQuizData({ ...quizData, questions: newQuestions });
  };

  const setCorrectOption = (qIndex: number, correctOIndex: number) => {
    const newQuestions = [...quizData.questions];
    newQuestions[qIndex].options = newQuestions[qIndex].options.map(
      (opt, idx) => ({
        ...opt,
        is_correct: idx === correctOIndex,
      }),
    );
    setQuizData({ ...quizData, questions: newQuestions });
  };

  const addOption = (qIndex: number) => {
    const newQuestions = [...quizData.questions];
    newQuestions[qIndex].options.push({ text: "", is_correct: false });
    setQuizData({ ...quizData, questions: newQuestions });
  };

  const removeQuestion = (index: number) => {
    const newQuestions = quizData.questions.filter((_, i) => i !== index);
    setQuizData({ ...quizData, questions: newQuestions });
  };

  const handleSaveQuiz = async () => {
    if (!activeLessonId) return;
    setIsSavingQuiz(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5000/api/lessons/${activeLessonId}/quiz`,
        quizData,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert("Quiz saved successfully!");
      setIsQuizModalOpen(false);

      // Reset state for next time
      setQuizData({
        pass_score: 80,
        questions: [
          {
            text: "",
            options: [
              { text: "", is_correct: true },
              { text: "", is_correct: false },
            ],
          },
        ],
      });
    } catch (error) {
      alert("Failed to save quiz. Please try again.");
    } finally {
      setIsSavingQuiz(false);
    }
  };

  return (
    <div className="max-w-4xl animate-in fade-in duration-300 relative">
      <h1 className="text-3xl font-bold mb-2 text-white">Curriculum Builder</h1>
      <p className="text-slate-400 mb-8">
        Design your course structure by adding modules and lessons.
      </p>

      <div className="space-y-6 mb-8">
        {modules.length === 0 ? (
          <div className="p-8 border-2 border-dashed border-white/10 rounded-2xl text-center">
            <p className="text-slate-500">
              Your curriculum is empty. Add a module to get started!
            </p>
          </div>
        ) : (
          modules.map((module, index) => (
            <div
              key={module.id}
              className="bg-slate-900/80 border border-white/10 rounded-xl overflow-hidden group"
            >
              <div className="p-5 flex items-center justify-between bg-slate-900 border-b border-white/5">
                <div className="flex items-center gap-4">
                  <GripVertical className="h-5 w-5 text-slate-600 cursor-grab hover:text-slate-400" />
                  <div>
                    <span className="text-xs font-bold text-indigo-400 mb-1 block">
                      Module {index + 1}
                    </span>
                    <h3 className="text-lg font-semibold text-white">
                      {module.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openLessonModal(module.id)}
                    className="text-sm bg-white/5 hover:bg-white/10 text-slate-300 px-4 py-2 rounded-lg transition-colors border border-white/5 flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" /> Add Lesson
                  </button>
                  <button
                    onClick={() => handleDeleteModule(module.id)}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete Module"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-2">
                {!module.lessons || module.lessons.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">
                    No lessons yet.
                  </p>
                ) : (
                  module.lessons.map((lesson, lIndex) => (
                    <div
                      key={lesson.id}
                      className="flex items-center gap-4 bg-slate-950 p-4 rounded-lg border border-white/5 hover:border-white/10 transition-colors"
                    >
                      <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                        {lIndex + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-slate-200">
                          {lesson.title}
                        </h4>
                      </div>

                      <div className="flex gap-3 items-center border-l border-white/5 pl-4">
                        <div className="flex gap-2 mr-2">
                          {lesson.video_url && (
                            <span title="Has Video">
                              <Video className="h-4 w-4 text-slate-500" />
                            </span>
                          )}
                          {lesson.content && (
                            <span title="Has Text Content">
                              <FileText className="h-4 w-4 text-slate-500" />
                            </span>
                          )}
                        </div>

                        {/* 🚀 ADD QUIZ BUTTON */}
                        <button
                          onClick={() => openQuizModal(lesson.id)}
                          className="flex items-center gap-1.5 text-xs bg-amber-500/10 text-amber-400 px-3 py-1.5 rounded-lg hover:bg-amber-500 hover:text-white transition-colors border border-amber-500/20 mr-1"
                          title="Attach a Quiz to this lesson"
                        >
                          <BrainCircuit className="h-4 w-4" /> Quiz
                        </button>

                        <button
                          onClick={() =>
                            handleDeleteLesson(module.id, lesson.id)
                          }
                          className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                          title="Delete Lesson"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <form
        onSubmit={handleCreateModule}
        className="bg-slate-900/50 border border-white/10 p-6 rounded-2xl"
      >
        <h3 className="text-lg font-semibold mb-4">Add New Module</h3>
        <div className="flex gap-4">
          <input
            type="text"
            required
            value={newModuleTitle}
            onChange={(e) => setNewModuleTitle(e.target.value)}
            placeholder="e.g., Section 1: Introduction to React"
            className="flex-1 px-4 py-2.5 bg-slate-950 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
          />
          <button
            type="submit"
            disabled={isCreatingModule}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-indigo-500 disabled:opacity-50 transition shadow-[0_0_15px_rgba(79,70,229,0.3)]"
          >
            <Plus className="h-5 w-5" />
            {isCreatingModule ? "Adding..." : "Add Module"}
          </button>
        </div>
      </form>

      {/* 🚀 THE QUIZ BUILDER MODAL */}
      {isQuizModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/10 bg-slate-800">
              <div className="flex items-center gap-3">
                <div className="bg-amber-500/20 p-2 rounded-lg border border-amber-500/20">
                  <BrainCircuit className="h-5 w-5 text-amber-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Quiz Builder</h2>
              </div>
              <button
                onClick={() => setIsQuizModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto flex-1 space-y-8 bg-slate-950">
              {/* Passing Score Setting */}
              <div className="flex items-center justify-between bg-slate-900 p-4 rounded-xl border border-white/10">
                <div>
                  <h3 className="font-semibold text-white">Passing Score</h3>
                  <p className="text-sm text-slate-400">
                    What percentage is required to pass?
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={quizData.pass_score}
                    onChange={(e) =>
                      setQuizData({
                        ...quizData,
                        pass_score: Number(e.target.value),
                      })
                    }
                    className="w-20 px-3 py-2 bg-slate-800 border border-white/10 text-white rounded-lg text-center"
                  />
                  <span className="text-slate-400 font-bold">%</span>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-6">
                {quizData.questions.map((q, qIndex) => (
                  <div
                    key={qIndex}
                    className="bg-slate-900 border border-white/10 rounded-xl p-5 relative group"
                  >
                    {/* Delete Question Button */}
                    {quizData.questions.length > 1 && (
                      <button
                        onClick={() => removeQuestion(qIndex)}
                        className="absolute -top-3 -right-3 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100"
                        title="Remove Question"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}

                    <div className="mb-4">
                      <label className="text-sm font-semibold text-indigo-400 mb-2 block">
                        Question {qIndex + 1}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. What is the virtual DOM in React?"
                        value={q.text}
                        onChange={(e) =>
                          updateQuestionText(qIndex, e.target.value)
                        }
                        className="w-full px-4 py-2 bg-slate-950 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>

                    <div className="space-y-2 pl-4 border-l-2 border-indigo-500/30">
                      {q.options.map((opt, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-3">
                          <input
                            type="radio"
                            name={`correct_answer_${qIndex}`}
                            checked={opt.is_correct}
                            onChange={() => setCorrectOption(qIndex, oIndex)}
                            className="w-4 h-4 text-indigo-600 bg-slate-800 border-slate-600 focus:ring-indigo-500 cursor-pointer"
                            title="Mark as correct answer"
                          />
                          <input
                            type="text"
                            placeholder={`Option ${oIndex + 1}`}
                            value={opt.text}
                            onChange={(e) =>
                              updateOptionText(qIndex, oIndex, e.target.value)
                            }
                            className={`flex-1 px-3 py-1.5 bg-slate-950 border rounded-lg outline-none transition-colors ${opt.is_correct ? "border-emerald-500/50 text-emerald-100" : "border-white/10 text-white focus:border-indigo-500"}`}
                          />
                        </div>
                      ))}

                      <button
                        onClick={() => addOption(qIndex)}
                        type="button"
                        className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 mt-3 font-medium"
                      >
                        <PlusCircle className="h-3 w-3" /> Add Option
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={addQuestion}
                type="button"
                className="w-full py-3 border-2 border-dashed border-white/20 rounded-xl text-slate-400 font-semibold hover:border-indigo-500/50 hover:text-indigo-400 hover:bg-indigo-500/5 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="h-5 w-5" /> Add Another Question
              </button>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 bg-slate-900 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setIsQuizModalOpen(false)}
                type="button"
                className="px-5 py-2.5 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveQuiz}
                disabled={isSavingQuiz}
                type="button"
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-indigo-500 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {isSavingQuiz ? "Saving..." : "Save Quiz to Lesson"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
