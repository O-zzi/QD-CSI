const rules = [
  {
    title: "Padel/Squash Court Footwear",
    description: "Only non-marking, appropriate indoor court shoes are permitted on playing surfaces. This preserves the court integrity and ensures maximum grip and safety for players.",
  },
  {
    title: "Air Rifle Certification",
    description: "Mandatory 30-minute safety course and proficiency test required before accessing the range. No exceptions for first-time users, regardless of previous experience.",
  },
  {
    title: "Booking & Cancellation Policy",
    description: "24-hour notice is required for all cancellations to avoid a penalty equal to the court fee. Late cancellations will forfeit the fee/credit to ensure fair slot availability for all members.",
  },
  {
    title: "General Conduct & Dress",
    description: "Respect for staff, facilities, and fellow players is mandatory. Appropriate sports attire must be worn. The use of courteous language is expected at all times.",
  },
];

export function RulesSection() {
  return (
    <section id="rules" className="qd-section">
      <div className="qd-container">
        <div className="mb-8">
          <h2 className="qd-section-title" data-testid="text-rules-title">Rules & Safety Protocols</h2>
          <p className="text-muted-foreground max-w-2xl mt-2">
            Ensuring a safe, respectful, and high-quality environment for all members and guests. These are our key rules.
          </p>
        </div>

        <div className="qd-rules-grid">
          {rules.map((rule, index) => (
            <div key={index} className="qd-rule-item" data-testid={`rule-item-${index}`}>
              <h4 className="font-bold text-foreground mb-2">{rule.title}</h4>
              <p className="text-sm text-muted-foreground">{rule.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
