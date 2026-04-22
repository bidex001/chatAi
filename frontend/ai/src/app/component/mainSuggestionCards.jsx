import { suggestionCards } from "./mainData";

const MainSuggestionCards = ({ isSending, onSelectPrompt }) => {
  return (
    <div className="grid w-full gap-4 md:grid-cols-2 xl:grid-cols-3">
      {suggestionCards.map((card) => {
        const Icon = card.icon;

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelectPrompt(card.prompt)}
            disabled={isSending}
            className="group relative overflow-hidden rounded-[28px] border border-white/80 bg-white/80 p-5 text-left shadow-[0_18px_40px_rgba(148,163,184,0.14)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_52px_rgba(79,70,229,0.16)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(129,140,248,0.2),_transparent_42%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.16),_transparent_36%)] opacity-70 transition duration-300 group-hover:opacity-100" />

            <div className="relative flex min-h-40 flex-col items-start gap-4">
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl shadow-sm ${card.iconClassName}`}
              >
                <Icon />
              </span>

              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-slate-900">
                  {card.title}
                </h2>
                <p className="text-sm leading-6 text-slate-500">
                  {card.description}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default MainSuggestionCards;
