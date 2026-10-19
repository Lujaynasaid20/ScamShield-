// Scam Awareness Academy content. Examples are illustrative, written for teaching, not real reported incidents.
// Bump ACADEMY_VERSION when modules are added so users get a "new lessons" notification.
export const ACADEMY_VERSION = 1;
export const PASS_MARK = 2;

export const MODULES = [
  {
    id: "phishing", icon: "bi-link-45deg", title: "Phishing and suspicious links", minutes: 4,
    summary: "How fake links and login pages steal passwords.",
    lesson: [
      "Phishing is when a scammer pretends to be a trusted organization to make you open a link and type in your password, card details or codes. The link leads to a page that looks real but is controlled by the scammer.",
      "The most important skill is reading the real domain: the part just before the first single slash. In https://login.mybank.com.secure-check.xyz/account, the real site is secure-check.xyz, not mybank.com."
    ],
    examples: [
      { channel: "SMS", text: "MyBank: Unusual sign-in detected. Confirm your identity within 2 hours at https://mybank-secure-verify.top to avoid suspension.", note: "Urgency, a threat, and a domain that only contains the bank's name." },
      { channel: "Email", text: "Your mailbox is full. Click here to upgrade storage and keep receiving emails.", note: "Generic warning with a link to a login page." }
    ],
    warningSigns: ["A link in an unexpected message asking you to log in", "Domains that contain a brand name plus extra words or hyphens", "Shortened links that hide the destination", "Pages that ask for codes right after your password"],
    tips: ["Open the official app or type the website address yourself", "Check the real domain before entering any details", "Turn on two-factor authentication on important accounts", "Scan doubtful links with the URL Scanner first"],
    quiz: [
      { question: "In https://paypal.com.account-help.net/login, which site would you really be visiting?", options: ["paypal.com", "account-help.net", "login"], answer: 1, explanation: "The registrable domain is the part just before the first single slash: account-help.net. \"paypal.com\" is only a subdomain label chosen to fool you." },
      { question: "A message says your account will close today unless you log in through its link. What is the safest action?", options: ["Click quickly before it closes", "Reply asking if it is real", "Open the official app or website yourself and check there"], answer: 2, explanation: "Going to the service directly avoids the link entirely. Replying only reaches the scammer." },
      { question: "Does a padlock (https) mean a website is legitimate?", options: ["Yes, it is verified", "No, it only means the connection is encrypted", "Only on mobile"], answer: 1, explanation: "Scam sites can get https certificates for free. The padlock protects the connection, not you from the site owner." }
    ]
  },
  {
    id: "jobs", icon: "bi-briefcase", title: "Fake job offers and recruitment scams", minutes: 4,
    summary: "Spotting jobs that ask you to pay or do \"tasks\" for money.",
    lesson: [
      "Fake job scams offer easy, well-paid work, often with no interview. They make money by charging fees (registration, training, uniforms, visas) or by pulling you into \"task\" schemes where you must deposit money to unlock earnings.",
      "Real employers do not charge you to get a job, and they do not recruit through unexpected WhatsApp messages promising daily payouts."
    ],
    examples: [
      { channel: "WhatsApp", text: "Hello! We are hiring part-time online reviewers. Earn 3,000–8,000 daily from your phone. No experience needed. Reply YES to start.", note: "Unsolicited, unrealistic pay, no company details." },
      { channel: "SMS", text: "Congratulations, you have been shortlisted for a hotel job abroad. Pay a 4,500 processing fee to secure your visa slot.", note: "An upfront fee to secure a job." }
    ],
    warningSigns: ["Job offers you never applied for", "Payment required for registration, training or visas", "High pay for very simple tasks", "Interviews only by chat, and pressure to decide quickly"],
    tips: ["Research the company through official channels", "Never pay to get a job", "Be wary of jobs that require you to deposit money to earn", "Ask for a written contract and a physical address"],
    quiz: [
      { question: "A recruiter asks you to pay a \"training fee\" before your first day. What does this most likely indicate?", options: ["Normal hiring practice", "A likely scam", "A sign of a premium employer"], answer: 1, explanation: "Legitimate employers cover their own training costs. Upfront fees are a hallmark of job scams." },
      { question: "You are told to deposit money to unlock the commission from completed \"tasks\". What is happening?", options: ["A task scam: deposits will grow and never be returned", "A normal bonus system", "A tax requirement"], answer: 0, explanation: "Task scams show fake earnings and require ever-larger deposits. Withdrawals are always blocked." },
      { question: "Which is the best way to check a job offer?", options: ["Ask the recruiter for references", "Contact the company through its official website or office", "Search for the recruiter's WhatsApp number"], answer: 1, explanation: "Independent contact through official channels confirms whether the vacancy is real." }
    ]
  },
  {
    id: "mobile-money", icon: "bi-phone", title: "Mobile-money and payment scams", minutes: 4,
    summary: "Wrong-number refunds, fake payment messages and PIN theft.",
    lesson: [
      "Mobile-money scams often start with a fake \"you have received money\" SMS followed by a call asking you to send it back because it was a mistake. Others pretend to be customer care and ask for your PIN to \"fix\" your account.",
      "Always confirm transactions in your official app or balance, never from a message alone. Customer care will never ask for your PIN."
    ],
    examples: [
      { channel: "SMS", text: "QX81LM2 Confirmed. You have received 2,500.00 from JOHN K 07XX XXX XXX. New balance 2,512.00.", note: "Fake confirmation that does not match your real balance, followed by a \"please send it back\" call." },
      { channel: "Call", text: "This is customer care. Your line will be blocked. Please give me your PIN so we can update your account.", note: "Requests your PIN: legitimate staff never do this." }
    ],
    warningSigns: ["A transfer message that is not reflected in your real balance", "Someone urgently asking for money sent \"by mistake\"", "Anyone asking for your PIN", "Requests to dial unfamiliar codes"],
    tips: ["Check your balance in the official app before reacting", "Let the provider reverse genuine mistakes", "Never share your PIN, even with \"agents\"", "Lock your SIM with a PIN"],
    quiz: [
      { question: "You get a message saying you received money, then a call asking you to send it back. What should you do first?", options: ["Send it back right away", "Check your actual balance in the official app", "Give the caller your PIN to confirm"], answer: 1, explanation: "Fake confirmation messages are common. Your real balance shows whether any money arrived." },
      { question: "Who is allowed to ask for your mobile-money PIN?", options: ["Customer care", "An agent", "Nobody"], answer: 2, explanation: "Your PIN is only for you. Anyone asking for it is attempting fraud." },
      { question: "If money really was sent to you by mistake, what is the safest way to return it?", options: ["Ask your provider to reverse it", "Send it to the number that calls you", "Send it to whoever texts first"], answer: 0, explanation: "The provider can reverse genuine errors safely and verify the transaction." }
    ]
  },
  {
    id: "prizes", icon: "bi-gift", title: "Fake prizes and lottery scams", minutes: 3,
    summary: "Why you never need to pay to receive a prize.",
    lesson: [
      "Prize scams tell you that you've won a lottery, promotion or giveaway you never entered. To \"release\" the prize, you must pay a fee or share personal details.",
      "Genuine promotions never ask winners to pay first, and you cannot win a draw you did not enter."
    ],
    examples: [
      { channel: "SMS", text: "CONGRATULATIONS! Your number has won 250,000 in our anniversary promotion. Send 1,200 clearance fee to claim your prize today.", note: "A prize you didn't enter plus a fee." }
    ],
    warningSigns: ["Winning a competition you did not enter", "Fees, taxes or \"clearance\" charges before payout", "Pressure to claim quickly", "Requests for ID or bank details"],
    tips: ["Ignore prize messages you did not expect", "Check promotions on the company's official channels", "Never pay to receive money"],
    quiz: [
      { question: "You won a prize, but must pay a small fee first. Is this normal?", options: ["Yes, for tax", "No, genuine prizes do not require payment first", "Only for big prizes"], answer: 1, explanation: "Legitimate promoters deduct any taxes themselves. Advance fees are the scam." },
      { question: "What is the best response to an unexpected prize SMS?", options: ["Reply to ask for details", "Ignore it or verify through official channels", "Forward it to friends"], answer: 1, explanation: "Replying confirms your number is active. Verify independently or ignore it." },
      { question: "Can you win a lottery you never entered?", options: ["Yes, numbers are picked randomly", "No", "Only with a mobile number"], answer: 1, explanation: "If you didn't enter, you can't win. That alone identifies the scam." }
    ]
  },
  {
    id: "impersonation", icon: "bi-person-badge", title: "Impersonation and identity fraud", minutes: 4,
    summary: "Fake officials, fake family members and stolen identities.",
    lesson: [
      "Impersonators pretend to be someone you trust: a bank, government office, police, your employer or a family member. They use urgency and authority so you act without checking.",
      "Identity fraud uses your personal details to open accounts or take loans. Protect copies of your ID and be careful what you share."
    ],
    examples: [
      { channel: "WhatsApp", text: "Hi Mum, I lost my phone and this is my new number. Can you send me money urgently? I'll explain later.", note: "A new number, urgency, and a money request." },
      { channel: "Call", text: "This is the tax office. You have unpaid penalties and a warrant will be issued unless you pay today.", note: "Authority plus threats and same-day payment." }
    ],
    warningSigns: ["A familiar name from an unknown number", "Threats of arrest or penalties", "Requests to keep it secret", "Payment to personal accounts"],
    tips: ["Call the person or organization back on a number you already know", "Agree on a family code word for emergencies", "Never send ID copies to unknown contacts"],
    quiz: [
      { question: "A \"relative\" messages from a new number asking for urgent money. What should you do?", options: ["Send a small amount to be safe", "Call them on their old, known number", "Ask a personal question by text only"], answer: 1, explanation: "Calling a known number confirms who you are talking to. Scammers may research answers to personal questions." },
      { question: "Would a government office demand payment to a personal mobile number?", options: ["Yes, if urgent", "No", "Only on weekends"], answer: 1, explanation: "Official payments go through official channels, never personal accounts." },
      { question: "What helps protect against identity fraud?", options: ["Sharing ID copies only with verified organizations", "Posting your ID to prove who you are", "Using the same password everywhere"], answer: 0, explanation: "Limiting who gets your ID details makes it harder to open accounts in your name." }
    ]
  },
  {
    id: "romance", icon: "bi-heart", title: "Romance scams", minutes: 4,
    summary: "When an online relationship turns into requests for money.",
    lesson: [
      "Romance scammers build an emotional relationship online, often over weeks. Once trust is built, a crisis appears: a medical emergency, customs fees, a blocked inheritance or an investment opportunity.",
      "They usually avoid video calls and meeting in person, and they move conversations to private apps."
    ],
    examples: [
      { channel: "Chat", text: "My love, I am stuck at the airport and customs will not release my bags without a fee. Please help me and I will repay you when I arrive.", note: "A crisis requiring money from someone you've never met." }
    ],
    warningSigns: ["Professing strong feelings very quickly", "Always an excuse not to video call", "A sudden emergency needing money", "Requests to keep the relationship secret"],
    tips: ["Never send money to someone you haven't met in person", "Reverse-search profile photos", "Talk to a friend you trust about the relationship"],
    quiz: [
      { question: "Your online partner can never video call but needs money for an emergency. What is the most likely explanation?", options: ["Bad internet", "A romance scam", "Shyness"], answer: 1, explanation: "Avoiding video plus money requests is the classic romance-scam pattern." },
      { question: "What is a good safety step when you meet someone online?", options: ["Reverse-search their photos", "Share your bank details to build trust", "Move to a private app quickly"], answer: 0, explanation: "Scammers often use stolen photos. A reverse image search can reveal this." },
      { question: "Should you send money to someone you have never met in person?", options: ["Yes, if they seem sincere", "No", "Only small amounts"], answer: 1, explanation: "Even small amounts lead to larger requests. Don't send money to people you haven't met." }
    ]
  },
  {
    id: "investment", icon: "bi-graph-up-arrow", title: "Investment and cryptocurrency scams", minutes: 4,
    summary: "Guaranteed returns, fake trading platforms and pyramid schemes.",
    lesson: [
      "Investment scams promise high, guaranteed returns with no risk. Fake trading apps show growing balances, but withdrawals are blocked or require more \"fees\".",
      "Every real investment carries risk. Check that firms are licensed by the financial regulator before investing."
    ],
    examples: [
      { channel: "Telegram", text: "Join our VIP crypto signals group. Guaranteed 30% weekly profit. Minimum deposit 10,000. Limited slots!", note: "Guaranteed high returns and scarcity." }
    ],
    warningSigns: ["Guaranteed or unusually high returns", "Pressure to recruit friends", "Withdrawal blocked until you pay more", "Unlicensed platforms or anonymous managers"],
    tips: ["Verify licensing with the financial regulator", "Be skeptical of returns that sound too good", "Never invest money you were pressured into"],
    quiz: [
      { question: "An app shows big profits but asks for a fee before you can withdraw. What does this suggest?", options: ["Normal processing", "The platform is likely fake", "You earned too much"], answer: 1, explanation: "Fake platforms invent balances and keep inventing fees to block withdrawals." },
      { question: "Which statement is true about investments?", options: ["Some are guaranteed risk-free with high returns", "All real investments carry some risk", "Crypto always goes up"], answer: 1, explanation: "Promises of no risk and high returns are a red flag." },
      { question: "How do you check an investment firm?", options: ["Look at testimonials in their group", "Check the financial regulator's list of licensed firms", "Ask the manager for screenshots"], answer: 1, explanation: "Testimonials and screenshots are easy to fake. The regulator's register is independent." }
    ]
  },
  {
    id: "account-takeover", icon: "bi-shield-lock", title: "Account takeover and verification-code theft", minutes: 3,
    summary: "Why one-time codes must never be shared.",
    lesson: [
      "A one-time code (OTP) is the final key to your account. Scammers trigger a login or password reset, then trick you into reading the code back: \"I sent you a code by mistake, please forward it.\"",
      "Anyone who has your code can take over your WhatsApp, email, bank or mobile-money account."
    ],
    examples: [
      { channel: "WhatsApp", text: "Hi, I accidentally sent my verification code to your number. Can you please send it to me?", note: "A request to forward a code that was really for your account." }
    ],
    warningSigns: ["Someone asking you to forward a code", "Codes you didn't request", "Calls from \"support\" that need your code", "Login alerts you don't recognize"],
    tips: ["Never share one-time codes with anyone", "Enable two-step verification with a PIN on messaging apps", "Change your password if you receive codes you didn't request"],
    quiz: [
      { question: "A friend's account asks you to forward a code sent to you by mistake. What is happening?", options: ["An innocent mistake", "Their account may be hijacked and the scammer wants yours too", "A system test"], answer: 1, explanation: "This is a common way to spread account takeovers from one victim to the next." },
      { question: "Who can you safely share a one-time code with?", options: ["Bank staff", "Nobody", "Friends"], answer: 1, explanation: "Codes are meant only for you to enter into the official app or site." },
      { question: "You receive a login code you didn't request. What should you do?", options: ["Ignore it and change your password", "Reply STOP", "Share it to cancel the request"], answer: 0, explanation: "Someone may be trying to sign in. Changing your password and enabling 2FA protects you." }
    ]
  },
  {
    id: "social-engineering", icon: "bi-people", title: "Social engineering", minutes: 3,
    summary: "The psychological tricks behind almost every scam.",
    lesson: [
      "Social engineering is manipulation: getting you to act against your own interest by triggering emotions such as fear, greed, curiosity, kindness or respect for authority.",
      "Almost every scam uses the same levers: urgency, authority, scarcity and secrecy. Recognizing the lever is often enough to stop the scam."
    ],
    examples: [
      { channel: "Call", text: "I'm calling from IT support. Your computer is sending viruses. Install this remote app so I can fix it now.", note: "Authority plus fear, leading to remote access." }
    ],
    warningSigns: ["Strong emotions: panic, excitement or guilt", "Requests to skip normal procedures", "Requests for secrecy", "Unsolicited help you didn't ask for"],
    tips: ["Slow down: urgency is a tactic", "Verify identities independently", "It's always OK to hang up and call back"],
    quiz: [
      { question: "Which tactic is the strongest sign of manipulation?", options: ["Polite greetings", "Pressure to act immediately", "Correct spelling"], answer: 1, explanation: "Urgency prevents you from thinking and checking." },
      { question: "A caller claims to be IT support and asks you to install a remote-access app. What should you do?", options: ["Install it", "Hang up and contact IT through known channels", "Give them your password instead"], answer: 1, explanation: "Remote-access apps give the caller full control of your device." },
      { question: "Why do scammers ask you to keep things secret?", options: ["For your privacy", "So nobody can warn you", "It's a legal requirement"], answer: 1, explanation: "Secrecy isolates you from people who might recognize the scam." }
    ]
  },
  {
    id: "shopping", icon: "bi-bag", title: "Online shopping scams", minutes: 3,
    summary: "Fake shops, fake sellers and payment tricks.",
    lesson: [
      "Shopping scams use fake websites, social-media shops or marketplace sellers offering big discounts. Once you pay, nothing arrives, or a fake \"delivery fee\" message follows.",
      "Prefer payment methods with buyer protection and be wary of sellers who insist on direct transfers."
    ],
    examples: [
      { channel: "Social media", text: "Brand new phones 70% off! Limited stock. Pay via mobile money to this number and we deliver tomorrow.", note: "Huge discount, direct payment, no buyer protection." },
      { channel: "SMS", text: "Your parcel is held at the depot. Pay 150 redelivery fee at http://parcel-redeliver.link", note: "A delivery-fee link for a parcel you may not be expecting." }
    ],
    warningSigns: ["Prices far below normal", "Only direct transfers accepted", "New pages with no history or reviews", "Delivery-fee messages for orders you don't recognize"],
    tips: ["Pay with methods that offer buyer protection", "Check reviews and the shop's history", "Track deliveries only in the courier's official app"],
    quiz: [
      { question: "A seller offers 70% off and only accepts direct mobile-money payment. What is the risk?", options: ["No risk", "You may lose your money with no way to get it back", "Delivery will be slower"], answer: 1, explanation: "Direct transfers have no buyer protection, which is why scammers insist on them." },
      { question: "You get a redelivery-fee link for a parcel you don't remember ordering. What should you do?", options: ["Pay the small fee", "Ignore it, or check in the courier's official app", "Reply with your address"], answer: 1, explanation: "Fake delivery messages are common phishing bait." },
      { question: "What makes an online shop more trustworthy?", options: ["Very low prices", "A long history, real reviews and secure payment options", "Lots of urgency banners"], answer: 1, explanation: "History, reviews and protected payments are harder for scammers to fake." }
    ]
  }
];

export const getModule = id => MODULES.find(module => module.id === id) || null;

// Grades answers on the server so stored scores cannot be faked by the browser.
export function gradeQuiz(module, answers) {
  if (!Array.isArray(answers) || answers.length !== module.quiz.length) return null;
  const results = module.quiz.map((question, index) => ({ correct: Number(answers[index]) === question.answer, answer: question.answer }));
  const score = results.filter(result => result.correct).length;
  return { score, total: module.quiz.length, passed: score >= PASS_MARK, results };
}
