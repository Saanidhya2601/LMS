import React from "react";
import { Plus, GripVertical, FileText, Video, Trash2 } from "lucide-react";

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
  return (
    <div className="max-w-4xl animate-in fade-in duration-300">
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
                        <div className="flex gap-2">
                          {lesson.video_url && (
                            <Video
                              className="h-4 w-4 text-slate-500"
                              title="Has Video"
                            />
                          )}
                          {lesson.content && (
                            <FileText
                              className="h-4 w-4 text-slate-500"
                              title="Has Text Content"
                            />
                          )}
                        </div>
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
    </div>
  );
}
