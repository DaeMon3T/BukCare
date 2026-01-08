import { useNavigate } from "react-router-dom";
import { Search, FileText, MessageCircle } from "lucide-react";

const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    { 
      label: "Find Doctor", 
      icon: Search, 
      color: "bg-blue-500", 
      path: "/patient/find-doctor",
      desc: "Book now" 
    },
    { 
      label: "Records", 
      icon: FileText, 
      color: "bg-emerald-500", 
      path: "/patient/appointments",
      desc: "View history"
    },
    { 
      label: "Message", 
      icon: MessageCircle, 
      color: "bg-rose-500", 
      path: "/patient/messages",
      desc: "Communicate"
    },
  ];

  return (
    <div className="flex overflow-x-auto gap-3 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide lg:grid lg:grid-cols-4 lg:overflow-visible lg:gap-4">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={() => navigate(action.path)}
          className="min-w-[140px] md:min-w-[160px] lg:min-w-0 flex-shrink-0 lg:flex-shrink group relative overflow-hidden bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 text-left hover:-translate-y-1"
        >
          <div className={`absolute top-0 right-0 w-16 h-16 ${action.color} opacity-10 rounded-bl-full -mr-2 -mt-2 transition-transform group-hover:scale-150`}></div>
          
          <div className={`w-10 h-10 ${action.color} text-white rounded-xl flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform`}>
            <action.icon className="w-5 h-5" />
          </div>
          
          <h3 className="font-bold text-slate-800 text-sm">{action.label}</h3>
          <p className="text-xs text-slate-500 mt-1 font-medium">{action.desc}</p>
        </button>
      ))}
    </div>
  );
};

export default QuickActions;