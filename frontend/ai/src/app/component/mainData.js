import { FaRegLightbulb } from "react-icons/fa";
import { RiCodeSSlashLine } from "react-icons/ri";
import { SiCoderwall } from "react-icons/si";

export const suggestionCards = [
  {
    id: "write",
    icon: SiCoderwall,
    iconClassName: "bg-sky-100 text-sky-600",
    title: "Help me write",
    description: "A professional email to a client about a project update.",
    prompt: "Write a professional email to a client about a project update.",
  },
  {
    id: "code",
    icon: RiCodeSSlashLine,
    iconClassName: "bg-violet-100 text-violet-600",
    title: "Explain this code",
    description: "A JavaScript function and how to optimize it.",
    prompt: "Explain this JavaScript function and suggest a cleaner optimized version.",
  },
  {
    id: "brainstorm",
    icon: FaRegLightbulb,
    iconClassName: "bg-emerald-100 text-emerald-600",
    title: "Brainstorm ideas",
    description: "For a productivity app targeted at remote teams.",
    prompt: "Brainstorm product ideas for a productivity app for remote teams.",
  },
];
