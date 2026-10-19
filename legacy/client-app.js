// Browser logic for the ScamShield UI. Runs once after the page markup mounts.
let started = false;

export function initApp(bootstrap) {
  if (started) return;
  started = true;
  const translations = {
    en: {
      workspace:"Workspace", tools:"Tools", navHome:"Home", navAnalyzer:"Message analyzer", navDashboard:"Admin dashboard", navRisk:"AI risk engine", navExplain:"Explainable AI", navReport:"Report a scam", privacyTitle:"Your message stays yours", privacyBody:"Checks run in this demo in your browser. Avoid sharing passwords or private account details.", saferInbox:"A safer inbox starts here", homeTitle:"Pause. Check. Protect.", homeSub:"A second opinion for the messages that don't feel right.", heroKicker:"Your personal scam spotter", heroTitle:"Trust your gut.<br>Verify the message.", heroBody:"Spot pressure tactics, suspicious links, and requests for money before they catch you off guard.", checkMessage:"Check a message", quickCheck:"Quick message check", multiLanguage:"Multilingual", pasteHere:"Paste your suspicious message here", privateCheck:"Your message isn't saved", analyzeNow:"Analyze message", howItWorks:"How it works", stepOne:"Paste the message", stepOneBody:"SMS, email, social post, or chat.", stepTwo:"Review the signals", stepTwoBody:"See what looks risky and why.", stepThree:"Choose your next step", stepThreeBody:"Get practical guidance, not just a score.", toolsForYou:"Protection tools", viewDashboard:"View dashboard", featureRisk:"AI risk engine", featureRiskSub:"Signals, not guesswork", featureExplain:"Clear explanations", featureExplainSub:"Know what triggered a flag", featureReport:"Scam reporting", featureReportSub:"Help your community stay alert", featureLanguage:"English + Kiswahili", featureLanguageSub:"Built for more conversations", askShield:"Ask Shield", askHint:"Ask a safety question in your language. Try “What should I do if I shared my PIN?”", askPlaceholder:"Ask a question in any language", checkBefore:"Check before you click", analyzerTitle:"Message analyzer", analyzerSub:"Paste the full message for a clearer risk assessment.", whatLooksOff:"Let's see what looks off.", analyzerIntro:"We look for pressure, payment requests, suspicious links, and personal information requests.", messageLabel:"Suspicious message", localAnalysis:"Demo analysis happens locally in this browser.", analyzeMessage:"Analyze message", tryExample:"Try an example:", exampleUrgent:"Urgent bank alert", examplePrize:"Prize message", exampleSafe:"Normal delivery update", noAccount:"No account needed", noStorage:"No message storage", explainable:"Every flag explained", analysisComplete:"Analysis complete", resultsTitle:"Your message breakdown", resultsSub:"Here are the signals behind this assessment.", checkAnother:"Check another", riskLevel:"Risk level", copySummary:"Copy summary", reportIt:"Report it", whyFlagged:"Why this was flagged", messageReviewed:"Message reviewed", whatToDo:"What to do next", overview:"Overview", dashboardTitle:"Admin dashboard", dashboardSub:"A local snapshot of checks and community reports.", newReport:"New report", totalChecks:"Messages checked", highRisk:"High risk flags", reportsFiled:"Reports filed", localSession:"This browser session", riskSignals:"Needs extra caution", communityData:"In this browser", languages:"Languages", riskActivity:"Risk activity", recentChecks:"Recent checks", recentReports:"Recent reports", noReportsYet:"No reports yet", reportsAppear:"Submitted reports appear here.", dashboardDemoNote:"Dashboard data is stored only in this browser. This demo has no shared admin backend.", communitySafety:"Community safety", reportScamTitle:"Report a scam", reportIntro:"Share the details without including passwords, PINs, or account numbers.", scamType:"Scam type", reportDetails:"What happened?", reportPlaceholder:"Describe the suspicious message or interaction", submitReport:"Submit report", enterMessage:"Paste a message first so I can check it.", lowRisk:"Low risk", mediumRisk:"Use caution", highRiskTitle:"High risk", lowSummary:"We found few common scam signals. Stay alert and verify unexpected requests independently.", mediumSummary:"Some warning signs showed up. Verify the sender before clicking or replying.", highSummary:"Several strong scam signals appeared. Do not click, pay, or share personal details.", signalUrgency:"Pressure or urgency", signalUrgencyBody:"Scammers rush people so they act before checking the facts.", signalMoney:"Money or payment request", signalMoneyBody:"The message pushes you to transfer money, pay a fee, or use an unusual payment method.", signalSecret:"Sensitive information request", signalSecretBody:"Legitimate organizations should not ask for your password, PIN, or one-time code by message.", signalLink:"Link or web address", signalLinkBody:"Unexpected links can lead to fake sign-in pages or unsafe downloads.", signalPrize:"Unexpected reward or offer", signalPrizeBody:"A prize you did not enter for can be bait to collect money or personal information.", signalThreat:"Threat or account warning", signalThreatBody:"Threats of account closure or legal action are a common pressure tactic.", signalGeneric:"Unusual message pattern", signalGenericBody:"This wording deserves a closer look. Contact the sender through a trusted channel.", signalNoStrong:"No strong scam signals found", signalNoStrongBody:"That does not guarantee the message is safe. Verify unexpected requests independently.", adviceHigh:"Do not reply, click links, or send money. Contact the organization using a number or website you find independently. If you shared banking details, contact your bank now.", adviceMedium:"Pause before acting. Find the sender's official website or phone number yourself and ask whether the message is real.", adviceLow:"No common warning signs were detected, but a low score is not a guarantee. Be careful with unexpected links and requests.", signals:"signals", copied:"Summary copied.", copyFail:"Couldn't copy automatically. Select and copy the summary.", reportSaved:"Report saved in this browser.", questionEmpty:"Ask a question first.", qPin:"If you shared your PIN, contact your bank immediately using its official app or the number on your card. Ask them to block access, change your PIN from a trusted device, and review recent transactions. Never share a one-time code.", qLink:"Don't open the link again. Visit the service's official site by typing its address yourself, change your password if you entered it, and enable two-factor authentication.", qMoney:"Stop further payments and contact your bank or payment provider immediately. Save screenshots and report the incident to your local fraud authority.", qGeneric:"Pause before replying or clicking. Verify the sender through an official phone number or website you find independently. Never share your password, PIN, or one-time code. If money or account access is involved, contact your bank directly.", qSwPin:"Kama umeshiriki PIN yako, wasiliana na benki yako mara moja kupitia programu rasmi au nambari iliyo kwenye kadi yako. Omba wafunge ufikiaji, badilisha PIN kwa kifaa salama, na ukague miamala ya hivi karibuni. Usishiriki msimbo wa uthibitisho.", qSwLink:"Usifungue kiungo hicho tena. Tembelea tovuti rasmi kwa kuandika anwani mwenyewe. Ikiwa uliingiza nenosiri, libadilishe na uwashe uthibitishaji wa hatua mbili.", qSwMoney:"Sitisha malipo mengine na uwasiliane na benki au huduma ya malipo mara moja. Hifadhi picha za skrini na uripoti tukio kwa mamlaka ya ulaghai iliyo karibu nawe.", qSwGeneric:"Subiri kabla ya kujibu au kubofya. Thibitisha mtumaji kwa kutumia nambari rasmi au tovuti unayoipata mwenyewe. Usishiriki nenosiri, PIN, au msimbo wa uthibitisho. Ikiwa pesa au akaunti yako imehusika, wasiliana na benki yako moja kwa moja.", reportTitle:"Scam report", scoreLabel:"Risk score", chartLabels:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
    },
    sw: {
      workspace:"Eneo la kazi", tools:"Zana", navHome:"Nyumbani", navAnalyzer:"Kichanganuzi cha ujumbe", navDashboard:"Dashibodi ya msimamizi", navRisk:"Injini ya hatari ya AI", navExplain:"AI inayoelezeka", navReport:"Ripoti ulaghai", privacyTitle:"Ujumbe wako ni wako", privacyBody:"Katika onyesho hili, ukaguzi hufanyika kwenye kivinjari chako. Usishiriki nywila au maelezo ya akaunti binafsi.", saferInbox:"Usalama wa ujumbe wako unaanzia hapa", homeTitle:"Subiri. Kagua. Jilinde.", homeSub:"Pata maoni ya pili kuhusu ujumbe unaotia shaka.", heroKicker:"Msaidizi wako wa kutambua ulaghai", heroTitle:"Sikiliza hisia zako.<br>Thibitisha ujumbe.", heroBody:"Tambua shinikizo, viungo vya kutiliwa shaka na maombi ya pesa kabla hayajakudanganya.", checkMessage:"Kagua ujumbe", quickCheck:"Ukaguzi wa haraka wa ujumbe", multiLanguage:"Lugha nyingi", pasteHere:"Bandika ujumbe unaoutilia shaka hapa", privateCheck:"Ujumbe wako hauhifadhiwi", analyzeNow:"Changanua ujumbe", howItWorks:"Jinsi inavyofanya kazi", stepOne:"Bandika ujumbe", stepOneBody:"SMS, barua pepe, chapisho au gumzo.", stepTwo:"Kagua ishara", stepTwoBody:"Ona kilicho hatari na sababu zake.", stepThree:"Chagua hatua inayofuata", stepThreeBody:"Pata ushauri wa vitendo, si alama pekee.", toolsForYou:"Zana za ulinzi", viewDashboard:"Angalia dashibodi", featureRisk:"Injini ya hatari ya AI", featureRiskSub:"Ishara, si kubahatisha", featureExplain:"Maelezo yaliyo wazi", featureExplainSub:"Jua kilichosababisha onyo", featureReport:"Kuripoti ulaghai", featureReportSub:"Saidia jamii yako kuwa macho", featureLanguage:"Kiingereza + Kiswahili", featureLanguageSub:"Imeundwa kwa mazungumzo zaidi", askShield:"Muulize Shield", askHint:"Uliza swali la usalama kwa lugha yako. Jaribu “Nifanye nini nikishiriki PIN yangu?”", askPlaceholder:"Uliza swali kwa lugha yoyote", checkBefore:"Kagua kabla ya kubofya", analyzerTitle:"Kichanganuzi cha ujumbe", analyzerSub:"Bandika ujumbe wote ili kupata tathmini bora ya hatari.", whatLooksOff:"Tuangalie kinachotia shaka.", analyzerIntro:"Tunatafuta shinikizo, maombi ya malipo, viungo vya kutiliwa shaka na maombi ya taarifa binafsi.", messageLabel:"Ujumbe unaoutilia shaka", localAnalysis:"Uchanganuzi wa onyesho hufanyika kwenye kivinjari hiki.", analyzeMessage:"Changanua ujumbe", tryExample:"Jaribu mfano:", exampleUrgent:"Tahadhari ya haraka ya benki", examplePrize:"Ujumbe wa zawadi", exampleSafe:"Taarifa ya kawaida ya usafirishaji", noAccount:"Huhitaji akaunti", noStorage:"Ujumbe hauhifadhiwi", explainable:"Kila onyo linaelezwa", analysisComplete:"Uchanganuzi umekamilika", resultsTitle:"Muhtasari wa ujumbe wako", resultsSub:"Hizi ndizo ishara zilizoathiri tathmini hii.", checkAnother:"Kagua mwingine", riskLevel:"Kiwango cha hatari", copySummary:"Nakili muhtasari", reportIt:"Ripoti", whyFlagged:"Sababu za onyo hili", messageReviewed:"Ujumbe uliokaguliwa", whatToDo:"Hatua inayofuata", overview:"Muhtasari", dashboardTitle:"Dashibodi ya msimamizi", dashboardSub:"Muhtasari wa ukaguzi na ripoti za jamii kwenye kivinjari hiki.", newReport:"Ripoti mpya", totalChecks:"Ujumbe uliokaguliwa", highRisk:"Tahadhari za hatari kubwa", reportsFiled:"Ripoti zilizowasilishwa", localSession:"Kipindi hiki cha kivinjari", riskSignals:"Unahitaji tahadhari zaidi", communityData:"Kwenye kivinjari hiki", languages:"Lugha", riskActivity:"Shughuli za hatari", recentChecks:"Ukaguzi wa hivi karibuni", recentReports:"Ripoti za hivi karibuni", noReportsYet:"Bado hakuna ripoti", reportsAppear:"Ripoti zilizowasilishwa zitaonekana hapa.", dashboardDemoNote:"Data ya dashibodi huhifadhiwa kwenye kivinjari hiki tu. Onyesho hili halina seva ya pamoja ya usimamizi.", communitySafety:"Usalama wa jamii", reportScamTitle:"Ripoti ulaghai", reportIntro:"Eleza kilichotokea bila kujumuisha nywila, PIN au nambari za akaunti.", scamType:"Aina ya ulaghai", reportDetails:"Nini kimetokea?", reportPlaceholder:"Eleza ujumbe au mawasiliano yanayotia shaka", submitReport:"Wasilisha ripoti", enterMessage:"Bandika ujumbe kwanza ili niukague.", lowRisk:"Hatari ndogo", mediumRisk:"Kuwa mwangalifu", highRiskTitle:"Hatari kubwa", lowSummary:"Tumegundua ishara chache za kawaida za ulaghai. Endelea kuwa macho na uthibitishe maombi usiyotarajia.", mediumSummary:"Kuna ishara za tahadhari. Thibitisha mtumaji kabla ya kubofya au kujibu.", highSummary:"Kuna ishara kadhaa kali za ulaghai. Usibofye, usilipe wala kushiriki taarifa binafsi.", signalUrgency:"Shinikizo au uharaka", signalUrgencyBody:"Walaghai huharakisha watu ili wachukue hatua bila kuthibitisha ukweli.", signalMoney:"Ombi la pesa au malipo", signalMoneyBody:"Ujumbe unakushinikiza kutuma pesa, kulipa ada au kutumia njia isiyo ya kawaida.", signalSecret:"Ombi la taarifa za siri", signalSecretBody:"Mashirika halali hayapaswi kukuomba nywila, PIN au msimbo wa muda kupitia ujumbe.", signalLink:"Kiungo au anwani ya tovuti", signalLinkBody:"Viungo usivyotarajia vinaweza kukupeleka kwenye tovuti bandia au kupakua faili hatari.", signalPrize:"Zawadi au ofa usiyotarajia", signalPrizeBody:"Zawadi ambayo hukuiombea inaweza kuwa mtego wa kupata pesa au taarifa zako.", signalThreat:"Tishio au onyo la akaunti", signalThreatBody:"Vitisho vya kufungwa kwa akaunti au hatua za kisheria ni mbinu ya kawaida ya shinikizo.", signalGeneric:"Muundo wa ujumbe usio wa kawaida", signalGenericBody:"Maneno haya yanahitaji kuangaliwa kwa makini. Wasiliana na mtumaji kupitia njia unayoamini.", signalNoStrong:"Hakuna ishara kali za ulaghai", signalNoStrongBody:"Hii haithibitishi kuwa ujumbe ni salama. Thibitisha maombi usiyotarajia kupitia njia rasmi.", adviceHigh:"Usijibu, usibofye viungo wala kutuma pesa. Wasiliana na shirika kupitia nambari au tovuti unayoipata mwenyewe. Ikiwa umeshiriki maelezo ya benki, wasiliana na benki yako sasa.", adviceMedium:"Subiri kabla ya kuchukua hatua. Tafuta tovuti au nambari rasmi ya mtumaji mwenyewe na uthibitishe ujumbe.", adviceLow:"Hakuna ishara za kawaida za hatari zilizopatikana, lakini alama ndogo si uthibitisho wa usalama. Kuwa mwangalifu na viungo au maombi usiyotarajia.", signals:"ishara", copied:"Muhtasari umenakiliwa.", copyFail:"Haikuweza kunakiliwa. Chagua na unakili muhtasari.", reportSaved:"Ripoti imehifadhiwa kwenye kivinjari hiki.", questionEmpty:"Andika swali kwanza.", qPin:"Ikiwa umeshiriki PIN yako, wasiliana na benki mara moja kupitia programu rasmi au nambari iliyo kwenye kadi yako. Omba wafunge ufikiaji, badilisha PIN kupitia kifaa salama na ukague miamala ya hivi karibuni. Usishiriki msimbo wa uthibitisho.", qLink:"Usifungue kiungo tena. Tembelea tovuti rasmi kwa kuandika anwani mwenyewe. Ikiwa uliingiza nywila, ibadilishe na uwashe uthibitishaji wa hatua mbili.", qMoney:"Sitisha malipo mengine na uwasiliane na benki au huduma ya malipo mara moja. Hifadhi picha za skrini na uripoti tukio kwa mamlaka ya ulaghai iliyo karibu nawe.", qGeneric:"Subiri kabla ya kujibu au kubofya. Thibitisha mtumaji kwa kutumia nambari rasmi au tovuti unayoipata mwenyewe. Usishiriki nywila, PIN au msimbo wa uthibitisho. Ikiwa pesa au akaunti yako imehusika, wasiliana na benki yako moja kwa moja.", qSwPin:"Kama umeshiriki PIN yako, wasiliana na benki yako mara moja kupitia programu rasmi au nambari iliyo kwenye kadi yako. Omba wafunge ufikiaji, badilisha PIN kwa kifaa salama, na ukague miamala ya hivi karibuni. Usishiriki msimbo wa uthibitisho.", qSwLink:"Usifungue kiungo hicho tena. Tembelea tovuti rasmi kwa kuandika anwani mwenyewe. Ikiwa uliingiza nenosiri, libadilishe na uwashe uthibitishaji wa hatua mbili.", qSwMoney:"Sitisha malipo mengine na uwasiliane na benki au huduma ya malipo mara moja. Hifadhi picha za skrini na uripoti tukio kwa mamlaka ya ulaghai iliyo karibu nawe.", qSwGeneric:"Subiri kabla ya kujibu au kubofya. Thibitisha mtumaji kwa kutumia nambari rasmi au tovuti unayoipata mwenyewe. Usishiriki nenosiri, PIN, au msimbo wa uthibitisho. Ikiwa pesa au akaunti yako imehusika, wasiliana na benki yako moja kwa moja.", reportTitle:"Ripoti ya ulaghai", scoreLabel:"Alama ya hatari", chartLabels:["Jtt","Jtn","Jnn","Alh","Ijm","Jmo","Jpl"]
    }
  };
  Object.assign(translations.en, {
    featuresMenu:"Features", login:"Log in", createAccount:"Create account", register:"Register", accountAccess:"Account access", authPageTitle:"Join ScamShield", authPageSub:"Create an account to keep your safety tools close.", authStoryTitle:"Make every message a little less uncertain.", authStoryBody:"Check suspicious messages, understand the warning signs, and help your community stay safer.", authStoryNote:"English and Kiswahili support", welcomeBack:"Welcome back", loginSubtitle:"Log in to your ScamShield account.", registerSubtitle:"Create your ScamShield account.", fullName:"Full name", namePlaceholder:"Your name", emailAddress:"Email address", emailPlaceholder:"you@example.com", password:"Password", passwordPlaceholder:"At least 8 characters", confirmPassword:"Confirm password", confirmPlaceholder:"Enter your password again", authDemoNote:"Demo only: accounts work in this page session. Connect an authentication backend for secure, persistent accounts.", logout:"Log out", accountCreated:"Demo account created. You are now signed in.", loginSuccess:"You are signed in.", loginFailed:"No matching demo account in this page session. Register first.", passwordMismatch:"Passwords do not match."
  });
  Object.assign(translations.sw, {
    featuresMenu:"Vipengele", login:"Ingia", createAccount:"Fungua akaunti", register:"Jisajili", accountAccess:"Ufikiaji wa akaunti", authPageTitle:"Jiunge na ScamShield", authPageSub:"Fungua akaunti ili uweze kutumia zana zako za usalama.", authStoryTitle:"Fanya kila ujumbe uwe rahisi kuelewa.", authStoryBody:"Kagua ujumbe unaotia shaka, elewa ishara za hatari na usaidie jamii yako kuwa salama.", authStoryNote:"Usaidizi wa Kiingereza na Kiswahili", welcomeBack:"Karibu tena", loginSubtitle:"Ingia kwenye akaunti yako ya ScamShield.", registerSubtitle:"Fungua akaunti yako ya ScamShield.", fullName:"Jina kamili", namePlaceholder:"Jina lako", emailAddress:"Anwani ya barua pepe", emailPlaceholder:"wewe@example.com", password:"Nenosiri", passwordPlaceholder:"Angalau herufi 8", confirmPassword:"Thibitisha nenosiri", confirmPlaceholder:"Weka nenosiri tena", authDemoNote:"Onyesho pekee: akaunti hufanya kazi katika kipindi hiki cha ukurasa. Unganisha mfumo wa uthibitishaji kwa akaunti salama na za kudumu.", logout:"Toka", accountCreated:"Akaunti ya onyesho imefunguliwa. Umeingia.", loginSuccess:"Umeingia.", loginFailed:"Hakuna akaunti ya onyesho inayolingana katika kipindi hiki. Jisajili kwanza.", passwordMismatch:"Nenosiri hazilingani."
  });
  Object.assign(translations.en, { navExplain:"Explainable AI", authDemoNote:"Demo only: this account is saved in this browser. A backend is required for secure accounts.", loginFailed:"No saved demo account matches those details. Register once in this browser first.", accountSaveFailed:"Couldn't save the account. Browser storage or secure cryptography may be unavailable." });
  Object.assign(translations.sw, { navExplain:"AI inayoelezeka", authDemoNote:"Onyesho pekee: akaunti huhifadhiwa kwenye kivinjari hiki. Mfumo wa seva unahitajika kwa akaunti salama.", loginFailed:"Hakuna akaunti ya onyesho iliyohifadhiwa inayolingana. Jisajili mara moja kwenye kivinjari hiki kwanza.", accountSaveFailed:"Akaunti haikuhifadhiwa. Hifadhi ya kivinjari au usimbaji fiche haupatikani." });
  Object.assign(translations.en, { navHistory:"Scam history", historyTitle:"Scam history", historySubtitle:"Previously analyzed cases saved in this browser.", historyEmpty:"No analyzed cases yet.", historyReview:"Review", historyStored:"Cases saved in this browser", scamTypeTitle:"Scam type", typeBank:"Bank or payment impersonation", typeDelivery:"Delivery or parcel scam", typeJob:"Job or task scam", typePrize:"Prize or lottery scam", typeInvestment:"Investment or crypto scam", typeRomance:"Romance scam", typeCredential:"Credential or phishing scam", typeImpersonation:"Organization impersonation", typeOther:"Other or unclear scam", urlScanTitle:"URL scanner", urlNone:"No links found in message.", urlReview:"Needs caution", urlUnverified:"Not checked online", urlWarnHttp:"Link does not use HTTPS.", urlWarnShortener:"Shortened link hides its destination.", urlWarnIp:"Link uses a numeric IP address.", urlWarnPunycode:"Domain uses international characters that may be imitated.", urlWarnLong:"Link has an unusually long subdomain.", urlWarnSuspiciousTld:"Domain ending is commonly abused.", phoneCheckTitle:"Phone number checker", phoneNone:"No phone numbers found.", phoneValid:"Number format looks possible; owner is not verified.", phoneInvalid:"Number format looks incomplete or unusual.", phoneNoLookup:"This demo cannot verify who owns a number.", previousMatch:"This message matches a case checked earlier.", whatToDo:"Recommended action" });
  Object.assign(translations.sw, { navHistory:"Historia ya ulaghai", historyTitle:"Historia ya ulaghai", historySubtitle:"Kesi zilizochanganuliwa kwenye kivinjari hiki.", historyEmpty:"Bado hakuna kesi zilizochanganuliwa.", historyReview:"Kagua", historyStored:"Kesi huhifadhiwa kwenye kivinjari hiki", scamTypeTitle:"Aina ya ulaghai", typeBank:"Kujifanya benki au huduma ya malipo", typeDelivery:"Ulaghai wa usafirishaji", typeJob:"Ulaghai wa kazi", typePrize:"Ulaghai wa zawadi au bahati nasibu", typeInvestment:"Ulaghai wa uwekezaji au sarafu ya kidijitali", typeRomance:"Ulaghai wa mahusiano", typeCredential:"Ulaghai wa nywila au taarifa za akaunti", typeImpersonation:"Kujifanya shirika", typeOther:"Ulaghai mwingine au usiojulikana", urlScanTitle:"Kikagua viungo", urlNone:"Hakuna kiungo kilichopatikana kwenye ujumbe.", urlReview:"Kinahitaji tahadhari", urlUnverified:"Hakijathibitishwa mtandaoni", urlWarnHttp:"Kiungo hakitumii HTTPS.", urlWarnShortener:"Kiungo kifupi kinaficha anwani kinakoelekea.", urlWarnIp:"Kiungo kinatumia anwani ya IP moja kwa moja.", urlWarnPunycode:"Jina la tovuti lina herufi za kimataifa zinazoweza kuigwa.", urlWarnLong:"Kiungo kina sehemu nyingi za jina la tovuti kuliko kawaida.", urlWarnSuspiciousTld:"Mwisho wa jina la tovuti hutumiwa vibaya mara nyingi.", phoneCheckTitle:"Kikagua nambari za simu", phoneNone:"Hakuna nambari ya simu iliyopatikana.", phoneValid:"Muundo wa nambari unaonekana sawa; mmiliki hajathibitishwa.", phoneInvalid:"Muundo wa nambari haujakamilika au si wa kawaida.", phoneNoLookup:"Onyesho hili haliwezi kuthibitisha mmiliki wa nambari.", previousMatch:"Ujumbe huu unafanana na kesi iliyokaguliwa awali.", whatToDo:"Hatua inayopendekezwa" });
  Object.assign(translations.en, { navAwareness:"Scam awareness", navProfile:"Profile", urlPageHint:"Paste a link to check it for common warning signs.", urlInputLabel:"Link to check", scanUrl:"Scan URL", localUrlCaveat:"Checks run locally. This does not query live threat-intelligence services.", phonePageHint:"Check a number's format and look for it in your own scam history.", phoneInputLabel:"Phone number", checkPhone:"Check number", localPhoneCaveat:"Format checks and your own history only; the owner is not verified.", awarenessTitle:"Scam awareness", awarenessSubtitle:"Simple habits that make common scams harder to pull off.", awarenessUrgency:"Pause when a message creates urgency", awarenessUrgencyBody:"Contact the organization through its official app or a number you find independently.", awarenessCodes:"Never share sign-in codes", awarenessCodesBody:"Banks and legitimate services do not need you to send a PIN, password, or one-time code in a message.", awarenessLinks:"Check links before opening them", awarenessLinksBody:"Read the full domain carefully and avoid shortened links in unexpected messages.", awarenessPayments:"Pause unusual payment requests", awarenessPaymentsBody:"Gift cards, crypto, and urgent transfer requests are hard to reverse. Verify first.", profileTitle:"Profile and settings", accountRole:"Account type", clearHistory:"Clear my scam history", adminReportsTitle:"Review reported scams", scamDatabaseTitle:"Scam database", usersTitle:"Users", insightsTitle:"Scam trends and detection performance", databaseHint:"Analyzed cases across all accounts.", inviteAdmin:"Invite admin", inviteAdminPlaceholder:"Invite admin by email", noData:"No data available.", reportedBy:"Reported by", statusOpen:"Open", statusReviewing:"Reviewing", statusConfirmed:"Confirmed scam", statusFalsePositive:"False positive", statusClosed:"Closed", updateStatus:"Update status", scamTrends:"Scam trends", detectionPerformance:"Detection performance", casesReviewed:"Cases reviewed", confirmedCases:"Confirmed scams", falsePositiveCases:"False positives", backendNotConfigured:"Connect a Supabase project to use secure accounts.", signupCheckEmail:"Check your email to confirm your account, then log in.", inviteSent:"Admin invitation sent.", adminOnly:"Admin access is required.", caseSaved:"Case saved to your account.", urlInvalid:"Enter a valid web address.", historyCleared:"Your scam history was cleared." });
  Object.assign(translations.sw, { navAwareness:"Elimu ya ulaghai", navProfile:"Wasifu", urlPageHint:"Bandika kiungo ili kukagua ishara za kawaida za hatari.", urlInputLabel:"Kiungo cha kukagua", scanUrl:"Kagua kiungo", localUrlCaveat:"Ukaguzi hufanyika hapa tu; hautafuti taarifa za vitisho mtandaoni.", phonePageHint:"Kagua muundo wa nambari na ulinganishe na historia yako ya ulaghai.", phoneInputLabel:"Nambari ya simu", checkPhone:"Kagua nambari", localPhoneCaveat:"Ni ukaguzi wa muundo na historia yako tu; mmiliki hajathibitishwa.", awarenessTitle:"Elimu ya ulaghai", awarenessSubtitle:"Tabia rahisi zinazosaidia kuzuia ulaghai wa kawaida.", awarenessUrgency:"Subiri ujumbe unapokushinikiza kuchukua hatua haraka", awarenessUrgencyBody:"Wasiliana na shirika kupitia programu rasmi au nambari unayoitafuta mwenyewe.", awarenessCodes:"Usishiriki misimbo ya kuingia", awarenessCodesBody:"Benki na huduma halali hazihitaji utume PIN, nenosiri au msimbo wa mara moja kwa ujumbe.", awarenessLinks:"Kagua viungo kabla ya kuvifungua", awarenessLinksBody:"Soma jina kamili la tovuti na epuka viungo vifupi usivyotarajia.", awarenessPayments:"Simama unapopokea ombi lisilo la kawaida la malipo", awarenessPaymentsBody:"Kadi za zawadi, sarafu za kidijitali na uhamisho wa haraka ni vigumu kurejesha. Thibitisha kwanza.", profileTitle:"Wasifu na mipangilio", accountRole:"Aina ya akaunti", clearHistory:"Futa historia yangu ya ulaghai", adminReportsTitle:"Kagua taarifa za ulaghai", scamDatabaseTitle:"Hifadhidata ya ulaghai", usersTitle:"Watumiaji", insightsTitle:"Mienendo ya ulaghai na utendaji wa ugunduzi", databaseHint:"Kesi zilizochanganuliwa kwenye akaunti zote.", inviteAdmin:"Alika msimamizi", inviteAdminPlaceholder:"Alika msimamizi kwa barua pepe", noData:"Hakuna data.", reportedBy:"Imetolewa na", statusOpen:"Wazi", statusReviewing:"Inakaguliwa", statusConfirmed:"Ulaghai umethibitishwa", statusFalsePositive:"Tahadhari isiyo sahihi", statusClosed:"Imefungwa", updateStatus:"Badilisha hali", scamTrends:"Mienendo ya ulaghai", detectionPerformance:"Utendaji wa ugunduzi", casesReviewed:"Kesi zilizokaguliwa", confirmedCases:"Ulaghai uliothibitishwa", falsePositiveCases:"Tahadhari zisizo sahihi", backendNotConfigured:"Unganisha mradi wa Supabase ili kutumia akaunti salama.", signupCheckEmail:"Thibitisha akaunti kupitia barua pepe kisha uingie.", inviteSent:"Mwaliko wa msimamizi umetumwa.", adminOnly:"Ufikiaji wa msimamizi unahitajika.", caseSaved:"Kesi imehifadhiwa kwenye akaunti yako.", urlInvalid:"Weka anwani sahihi ya tovuti.", historyCleared:"Historia yako ya ulaghai imefutwa." });
  Object.assign(translations.en, { authDemoNote:"Sign in uses the ScamShield Supabase project. User reports and cases are private to your account.", signupCheckEmail:"Check your email to confirm your account, then log in.", backendNotConfigured:"Connect Supabase first: copy .env.example to .env.local and enter your project URL and anon key.", dataLoadFailed:"Could not load account data. Check the Supabase schema and access policies.", profileLoadFailed:"Could not load your account role. Contact an administrator.", caseSaveFailed:"Could not save this case. Check your Supabase connection.", adminRole:"Administrator", userRole:"User", adminAccountsNote:"Accounts in this project", adminDataNote:"Admin statistics cover accounts and reports in this Supabase project." });
  Object.assign(translations.sw, { authDemoNote:"Ingia kupitia mradi wa ScamShield Supabase. Ripoti na kesi zako ni za akaunti yako.", signupCheckEmail:"Thibitisha akaunti kupitia barua pepe kisha uingie.", backendNotConfigured:"Unganisha Supabase: nakili .env.example kuwa .env.local na uweke Project URL na anon key.", dataLoadFailed:"Data haikuweza kupakiwa. Kagua schema na sera za Supabase.", profileLoadFailed:"Jukumu la akaunti halikupatikana. Wasiliana na msimamizi.", caseSaveFailed:"Kesi haikuhifadhiwa. Kagua muunganisho wa Supabase.", adminRole:"Msimamizi", userRole:"Mtumiaji", adminAccountsNote:"Akaunti katika mradi huu", adminDataNote:"Takwimu za msimamizi zinajumuisha akaunti na ripoti za mradi huu wa Supabase." });
  Object.assign(translations.en, { historySubtitle:"Cases analyzed by your account.", historyStored:"Cases stored in your account", dashboardSub:"Project-wide view of checks and community reports.", localSession:"All accounts in this project", communityData:"In this project" });
  Object.assign(translations.sw, { historySubtitle:"Kesi zilizochanganuliwa na akaunti yako.", historyStored:"Kesi zimehifadhiwa kwenye akaunti yako", dashboardSub:"Muhtasari wa ukaguzi na ripoti kwenye mradi wote.", localSession:"Akaunti zote kwenye mradi huu", communityData:"Kwenye mradi huu" });
  Object.assign(translations.en, { authDemoNote:"Accounts are stored in this PostgreSQL database.", signupCheckEmail:"Your account is ready. You are now signed in.", backendNotConfigured:"PostgreSQL is not connected. Check the database settings in .env.local.", dataLoadFailed:"Could not load account data. Check PostgreSQL and the database schema.", profileLoadFailed:"Could not load your account. Please sign in again.", caseSaveFailed:"Could not save this case. Check the PostgreSQL connection.", adminDataNote:"Admin statistics cover accounts and reports in this PostgreSQL database.", adminAccountsNote:"Accounts in this database", inviteAdmin:"Promote admin", inviteAdminPlaceholder:"Promote a registered user by email", inviteSent:"Admin access granted." });
  Object.assign(translations.sw, { authDemoNote:"Akaunti huhifadhiwa kwenye hifadhidata hii ya PostgreSQL.", signupCheckEmail:"Akaunti yako iko tayari. Umeingia.", backendNotConfigured:"PostgreSQL haijaunganishwa. Kagua mipangilio ya hifadhidata kwenye .env.local.", dataLoadFailed:"Data ya akaunti haikupatikana. Kagua PostgreSQL na schema ya hifadhidata.", profileLoadFailed:"Akaunti yako haikupatikana. Tafadhali ingia tena.", caseSaveFailed:"Kesi haikuhifadhiwa. Kagua muunganisho wa PostgreSQL.", adminDataNote:"Takwimu za msimamizi zinajumuisha akaunti na ripoti katika hifadhidata hii ya PostgreSQL.", adminAccountsNote:"Akaunti katika hifadhidata hii", inviteAdmin:"Mpe msimamizi", inviteAdminPlaceholder:"Mpe mtumiaji aliyesajiliwa kwa barua pepe", inviteSent:"Ufikiaji wa msimamizi umetolewa." });
  Object.assign(translations.en, { adminTab:"Admin", adminLoginTitle:"Admin login", adminLoginSubtitle:"Log in with your administrator account.", adminLoginButton:"Log in as admin" });
  Object.assign(translations.sw, { adminTab:"Msimamizi", adminLoginTitle:"Kuingia kwa msimamizi", adminLoginSubtitle:"Ingia kwa akaunti yako ya msimamizi.", adminLoginButton:"Ingia kama msimamizi" });
  Object.assign(translations.en, { checkerTitle:"URL & phone checker", checkerHint:"Check a link or a phone number for common warning signs." });
  Object.assign(translations.sw, { checkerTitle:"Kikagua viungo na simu", checkerHint:"Kagua kiungo au nambari ya simu kwa dalili za kawaida za hatari." });
  const state = { lang: "en", currentMessage: "", latestResult: null, checks: [], reports: [], history: [], profiles: [], authUser: null, profile: null };
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const t = (key) => translations[state.lang][key] || translations.en[key] || key;
  async function apiRequest(url, options = {}) {
    const hasBody = options.body !== undefined;
    const response = await fetch(url, {
      ...options,
      credentials: "same-origin",
      headers: { ...(hasBody ? { "Content-Type": "application/json" } : {}), ...options.headers },
      body: hasBody ? JSON.stringify(options.body) : undefined
    });
    const payload = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) {
      const error = new Error(payload?.error || "The request could not be completed.");
      error.status = response.status;
      throw error;
    }
    return payload;
  }
  async function loadAccountData() {
    if (!state.authUser) return;
    try {
      const data = await apiRequest("/api/account/data");
      state.history = (data.cases || []).map(item => ({ ...item, scamType: item.scam_type, urlChecks: item.url_checks, phoneChecks: item.phone_checks, level: item.risk_level, date: new Date(item.created_at).getTime() }));
      state.checks = state.history.map(item => ({ level: item.level, score: item.score, date: item.date }));
      state.reports = data.reports || [];
      state.profiles = data.profiles || [];
      updateDashboard();
    } catch {
      toast(t("dataLoadFailed"));
    }
  }
  async function activateUser(profile) {
    state.authUser = { id: profile.id, email: profile.email };
    state.profile = profile;
    await loadAccountData();
    updateAuthActions();
    updateDashboard();
    showView(profile.role === "admin" ? "dashboard" : "home");
    return true;
  }
  async function restoreSession() {
    try {
      const { profile } = await apiRequest("/api/auth/session");
      await activateUser(profile);
    } catch (error) {
      if (error.status !== 401) toast(error.message);
      state.authUser = null; state.profile = null; state.history = []; state.reports = []; state.checks = []; state.profiles = [];
      updateAuthActions(); updateDashboard(); showView("auth");
    }
  }
  function setLanguage(language) {
    state.lang = language;
    document.documentElement.lang = language === "sw" ? "sw" : "en";
    $$('[data-lang]').forEach(button => { const active = button.dataset.lang === language; button.classList.toggle("active", active); button.setAttribute("aria-pressed", String(active)); });
    $$('[data-i18n]').forEach(node => { const value = t(node.dataset.i18n); if (value.includes("<br>")) node.innerHTML = value; else node.textContent = value; });
    $$('[data-i18n-placeholder]').forEach(node => node.placeholder = t(node.dataset.i18nPlaceholder));
    $("#analysis-disclosure").textContent = language === "sw" ? "Onyesho hili hutafuta maneno muhimu tu; huduma ya AI haijaunganishwa." : "Keyword-based local demo; no AI service connected.";
    setAuthMode($("#auth-form").dataset.mode || "login");
    updateDashboard();
    if (state.latestResult) renderResult(analyzeMessage(state.latestResult.message), false);
  }
  function showView(view) {
    const isAdmin = state.profile?.role === "admin";
    const adminViews = ["dashboard", "admin-reports", "scam-database", "admin-users", "admin-insights"];
    const userViews = ["home", "analyzer", "results", "history", "url-scanner", "awareness", "profile"];
    if (!state.authUser && view !== "auth") view = "auth";
    else if (state.authUser && adminViews.includes(view) && !isAdmin) view = "home";
    else if (state.authUser && userViews.includes(view) && isAdmin) view = "dashboard";
    const page = $(`#page-${view}`);
    if (!page) return;
    $$('.page').forEach(item => item.classList.toggle("active", item === page));
    $$('[data-view]').forEach(button => button.classList.toggle("active", button.dataset.view === view));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function setAuthMode(mode) {
    const registering = mode === "register";
    const adminMode = mode === "admin";
    const layout = $("#page-auth .auth-layout");
    const story = $(".auth-story", layout);
    const previousLeft = story.getBoundingClientRect().left;
    const form = $("#auth-form");
    form.dataset.mode = registering ? "register" : adminMode ? "admin" : "login";
    layout.classList.toggle("registering", registering);
    $("#auth-name-field").hidden = !registering;
    $("#auth-confirm-field").hidden = !registering;
    $("#auth-name").required = registering;
    $("#auth-confirm").required = registering;
    $("#auth-password").autocomplete = registering ? "new-password" : "current-password";
    $("#auth-form-title").textContent = t(registering ? "register" : adminMode ? "adminLoginTitle" : "welcomeBack");
    $("#auth-form-subtitle").textContent = t(registering ? "registerSubtitle" : adminMode ? "adminLoginSubtitle" : "loginSubtitle");
    $("#auth-submit").textContent = t(registering ? "createAccount" : adminMode ? "adminLoginButton" : "login");
    $$('[data-auth-mode]').forEach(button => {
      if (button.closest(".auth-mode-switch")) {
        const active = button.dataset.authMode === mode;
        button.classList.toggle("active", active);
        button.setAttribute("aria-selected", String(active));
      }
    });
    const movement = previousLeft - story.getBoundingClientRect().left;
    if (Math.abs(movement) > 1 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      story.animate(
        [{ transform: `translateX(${movement}px)` }, { transform: "translateX(0)" }],
        { duration: 420, easing: "cubic-bezier(.2,.75,.25,1)" }
      );
    }
  }
  function updateAuthActions() {
    const signedIn = Boolean(state.authUser);
    const role = state.profile?.role || "user";
    $("#app-header").hidden = !signedIn;
    $("#feature-navigation").hidden = !signedIn;
    $$("#app-header [data-role]").forEach(button => { button.hidden = button.dataset.role !== role; });
    $("#logout-button").hidden = !signedIn;
    $("#profile-name").textContent = state.profile?.display_name || "";
    $("#profile-email").textContent = state.authUser?.email || "";
    $("#profile-role").textContent = role === "admin" ? t("adminRole") : t("userRole");
    $("[data-action='invite-admin']").hidden = role !== "admin";
  }
  function normalizeMessage(message) { return message.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
  function detectScamType(text) {
    const patterns = [
      ["typePrize", /\b(won|winner|prize|lottery|claim your prize|zawadi|umeshinda|bahati nasibu)\b/],
      ["typeJob", /\b(job offer|work from home|task job|recruitment|employment|kazi ya nyumbani|ajira)\b/],
      ["typeDelivery", /\b(delivery|parcel|package|courier|shipment|usafirishaji|kifurushi)\b/],
      ["typeInvestment", /\b(crypto|cryptocurrency|investment|invest now|guaranteed returns|sarafu ya kidijitali|uwekezaji)\b/],
      ["typeRomance", /\b(dating|romance|relationship|lover|mpenzi|mahusiano)\b/],
      ["typeBank", /\b(bank|banking|account|mpesa|m-pesa|mobile money|benki|akaunti)\b/],
      ["typeCredential", /\b(password|passcode|pin|one.time code|verification code|otp|login|sign in|nywila|nambari ya siri)\b/],
      ["typeImpersonation", /\b(police|government|tax office|support team|official department|polisi|serikali|mamlaka)\b/]
    ];
    return patterns.find(([, pattern]) => pattern.test(text))?.[0] || "typeOther";
  }
  function scanUrls(message) {
    const candidates = message.match(/(?:https?:\/\/|www\.)[^\s<>"']+|\b(?:bit\.ly|tinyurl\.com|t\.co|rb\.gy)\/[^\s<>"']+/gi) || [];
    const shorteners = new Set(["bit.ly", "tinyurl.com", "t.co", "rb.gy"]);
    const riskyTlds = new Set(["click", "country", "gq", "link", "loan", "mov", "top", "work", "xyz", "zip"]);
    return [...new Set(candidates.map(value => value.replace(/[),.;!?\]}]+$/g, "")))].map(value => {
      const candidate = value.startsWith("www.") || !/^https?:\/\//i.test(value) ? `https://${value}` : value;
      const reasons = [];
      try {
        const url = new URL(candidate);
        const host = url.hostname.toLowerCase().replace(/^www\./, "");
        if (url.protocol !== "https:") reasons.push("urlWarnHttp");
        if (shorteners.has(host)) reasons.push("urlWarnShortener");
        if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(host) || /^\[[\da-f:]+\]$/i.test(host)) reasons.push("urlWarnIp");
        if (/(^|\.)xn--/i.test(host)) reasons.push("urlWarnPunycode");
        if (host.split(".").length > 4) reasons.push("urlWarnLong");
        if (riskyTlds.has(host.split(".").pop())) reasons.push("urlWarnSuspiciousTld");
      } catch { reasons.push("urlWarnHttp"); }
      return { value, reasons };
    });
  }
  function scanPhoneNumbers(message) {
    const candidates = message.match(/(?<!\w)\+?\d[\d\s().-]{6,}\d(?!\w)/g) || [];
    const found = new Map();
    candidates.forEach(candidate => {
      const value = candidate.trim().replace(/[.,;:]+$/g, "");
      if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$/.test(value)) return;
      const digits = value.replace(/\D/g, "");
      if (digits.length < 7 || digits.length > 15) return;
      const normalized = `${value.startsWith("+") ? "+" : ""}${digits}`;
      found.set(normalized, { value, validFormat: digits.length >= 7 && digits.length <= 15 });
    });
    return [...found.values()];
  }
  function analyzeMessage(message) {
    const text = message.toLowerCase();
    const signals = [];
    const include = (test, title, body, strength) => { if (test) signals.push({ title: t(title), body: t(body), strength }); };
    const urlChecks = scanUrls(message);
    const phoneChecks = scanPhoneNumbers(message);
    const normalized = normalizeMessage(message);
    const previousCase = state.history.find(item => normalizeMessage(item.message || "") === normalized);
    const sw = state.lang === "sw" || /\b(tuma pesa|akaunti yako|nambari ya siri|zawadi|bonyeza|haraka sana|ada ya usafirishaji|umeshinda|uthibitishe|lipa sasa)\b/i.test(text);
    const urgency = /\b(urgent|immediately|act now|within 24 hours|today only|final warning|suspended|expire|limited time|haraka|mara moja|sasa hivi|leo tu|akaunti.*fungwa|imefungwa|imeisha muda)\b/i.test(text);
    const money = /\b(send money|transfer|payment|pay now|processing fee|wire|gift card|crypto|deposit|tuma pesa|lipa|malipo|ada ya|fedha|pesa|gharama ya usafirishaji)\b/i.test(text);
    const secret = /\b(password|passcode|pin|one.time code|verification code| otp|bank details|nambari ya siri|nywila|msimbo wa uthibitisho|taarifa za akaunti)\b/i.test(text);
    const link = urlChecks.length > 0;
    const prize = /\b(you('ve| have) won|winner|claim your prize|free gift|congratulations|umeshinda|zawadi|bahati nasibu|zawadi yako)\b/i.test(text);
    const threat = /\b(account.*(locked|suspended|closed)|arrest|legal action|police|kufungwa kwa akaunti|akaunti.*(imefungwa|imesimamishwa)|kukamatwa|hatua za kisheria)\b/i.test(text);
    include(urgency, "signalUrgency", "signalUrgencyBody", 18);
    include(money, "signalMoney", "signalMoneyBody", 25);
    include(secret, "signalSecret", "signalSecretBody", 30);
    include(link, "signalLink", "signalLinkBody", 20);
    include(prize, "signalPrize", "signalPrizeBody", 23);
    include(threat, "signalThreat", "signalThreatBody", 20);
    if (!signals.length && text.length < 5000) signals.push({ title: t("signalNoStrong"), body: t("signalNoStrongBody"), strength: 0, safe: true });
    let score = Math.min(98, signals.reduce((sum, signal) => sum + signal.strength, 0));
    if (sw && signals.length && score < 22) score = 28;
    const level = score >= 55 ? "high" : score >= 25 ? "medium" : "low";
    const title = level === "high" ? t("highRiskTitle") : level === "medium" ? t("mediumRisk") : t("lowRisk");
    const summary = level === "high" ? t("highSummary") : level === "medium" ? t("mediumSummary") : t("lowSummary");
    const advice = level === "high" ? t("adviceHigh") : level === "medium" ? t("adviceMedium") : t("adviceLow");
    return { message, score, level, title, summary, advice, signals, scamType: detectScamType(text), urlChecks, phoneChecks, previousMatch: previousCase?.date || null };
  }
  function formatDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat(state.lang === "sw" ? "sw-KE" : "en", { dateStyle: "medium", timeStyle: "short" }).format(date);
  }
  function renderCheckList(container, entries, emptyKey, describe) {
    container.replaceChildren();
    if (!entries.length) {
      const empty = document.createElement("small"); empty.className = "input-help"; empty.textContent = t(emptyKey); container.append(empty); return;
    }
    entries.forEach(entry => {
      const row = document.createElement("div"); row.className = "check-entry";
      const value = document.createElement("strong"); value.textContent = entry.value;
      const details = document.createElement("small"); details.textContent = describe(entry);
      row.append(value, details); container.append(row);
    });
  }
  function renderResult(result, save = true) {
    state.latestResult = result;
    const color = result.level === "high" ? "#bc5943" : result.level === "medium" ? "#b47b18" : "#267358";
    const banner = $("#result-banner");
    banner.style.setProperty("--risk-color", color);
    banner.style.setProperty("--risk-deg", `${result.score * 3.6}deg`);
    $("#risk-score").textContent = result.score;
    $("#risk-title").textContent = result.title;
    $("#risk-summary").textContent = result.summary;
    $("#quoted-message").textContent = result.message;
    $("#risk-advice").textContent = result.advice;
    $("#scam-type-result").textContent = t(result.scamType || "typeOther");
    const historyMatch = $("#history-match");
    historyMatch.hidden = !result.previousMatch;
    historyMatch.textContent = result.previousMatch ? `${t("previousMatch")} ${formatDate(result.previousMatch)}` : "";
    renderCheckList($("#url-results"), result.urlChecks || [], "urlNone", check => `${check.reasons.length ? `${t("urlReview")}: ${check.reasons.map(t).join(" ")}` : t("urlUnverified")}`);
    renderCheckList($("#phone-results"), result.phoneChecks || [], "phoneNone", check => `${t(check.validFormat ? "phoneValid" : "phoneInvalid")} ${t("phoneNoLookup")}`);
    $("#signal-count").textContent = `${result.signals.length} ${t("signals")}`;
    const list = $("#signal-list");
    list.replaceChildren();
    result.signals.forEach(signal => {
      const row = document.createElement("div"); row.className = "signal-row";
      const icon = document.createElement("span"); icon.className = `signal-check${signal.safe ? " safe" : ""}`; icon.innerHTML = `<i class="bi ${signal.safe ? "bi-check2" : "bi-exclamation"}"></i>`;
      const copy = document.createElement("div"); const title = document.createElement("strong"); title.textContent = signal.title; const body = document.createElement("p"); body.textContent = signal.body; copy.append(title, body); row.append(icon, copy); list.append(row);
    });
    if (save) {
      saveCase(result);
    }
    updateDashboard(); showView("results");
  }
  async function saveCase(result) {
    if (!state.authUser) return;
    try {
      const { item } = await apiRequest("/api/cases", {
        method: "POST",
        body: {
          message: result.message,
          score: result.score,
          risk_level: result.level,
          scam_type: result.scamType,
          signals: result.signals,
          url_checks: result.urlChecks,
          phone_checks: result.phoneChecks
        }
      });
      const saved = { ...item, scamType: item.scam_type, urlChecks: item.url_checks, phoneChecks: item.phone_checks, level: item.risk_level, date: new Date(item.created_at).getTime() };
      state.history.unshift(saved);
      state.checks.unshift({ level: saved.level, score: saved.score, date: saved.date });
      result.id = saved.id;
      result.date = saved.date;
      updateDashboard();
      toast(t("caseSaved"));
    } catch (error) {
      toast(error.message || t("caseSaveFailed"));
    }
  }
  function runAnalysis(fieldId) {
    const message = $(`#${fieldId}`).value.trim();
    if (!message) { toast(t("enterMessage")); $(`#${fieldId}`).focus(); return; }
    state.currentMessage = message;
    renderResult(analyzeMessage(message));
  }
  function updateHistory() {
    const list = $("#history-list");
    list.replaceChildren();
    $("#history-count").textContent = state.history.length;
    if (!state.history.length) {
      const empty = document.createElement("p"); empty.className = "input-help"; empty.textContent = t("historyEmpty"); list.append(empty); return;
    }
    state.history.slice(0, 100).forEach(record => {
      const row = document.createElement("div"); row.className = "history-row";
      const description = document.createElement("div");
      const title = document.createElement("strong"); title.textContent = t(record.scamType || "typeOther");
      const detail = document.createElement("small"); detail.textContent = `${formatDate(record.date)} · ${record.message.slice(0, 90)}`;
      description.append(title, detail);
      const risk = document.createElement("span"); risk.className = "history-risk"; risk.style.setProperty("--risk-color", record.level === "high" ? "#bc5943" : record.level === "medium" ? "#b47b18" : "#267358"); risk.textContent = `${record.score}/100`;
      const review = document.createElement("button"); review.type = "button"; review.className = "btn btn-outline-app"; review.dataset.historyId = record.id; review.textContent = t("historyReview");
      row.append(description, risk, review); list.append(row);
    });
  }
  function updateDashboard() {
    updateHistory();
    if (state.profile?.role === "admin") renderAdminSections();
    $("#metric-checks").textContent = state.checks.length;
    $("#metric-high").textContent = state.checks.filter(item => item.level === "high").length;
    $("#metric-reports").textContent = state.reports.length;
    $("#report-total").textContent = state.reports.length;
    $("#metric-users").textContent = state.profiles.length;
    const labels = t("chartLabels");
    const recent = state.checks.slice(0, 7).reverse();
    const bars = $("#chart-bars"); bars.replaceChildren();
    labels.forEach((label, index) => {
      const day = recent[index]; const group = document.createElement("div"); group.className = "chart-group";
      const bar = document.createElement("span"); bar.className = "bar"; bar.style.height = `${day ? Math.max(9, Math.min(100, day.score)) : 8}%`; bar.title = day ? `${day.score}% risk` : "No check";
      const small = document.createElement("small"); small.textContent = label; group.append(bar, small); bars.append(group);
    });
    const list = $("#activity-list"); list.replaceChildren();
    if (!state.reports.length) {
      const empty = document.createElement("div"); empty.className = "activity-item"; empty.innerHTML = `<span class="activity-icon"><i class="bi bi-inbox"></i></span><div><strong>${t("noReportsYet")}</strong><small>${t("reportsAppear")}</small></div>`; list.append(empty); return;
    }
    state.reports.slice(0, 4).forEach(report => {
      const item = document.createElement("div"); item.className = "activity-item";
      const icon = document.createElement("span"); icon.className = "activity-icon"; icon.innerHTML = '<i class="bi bi-flag"></i>';
      const copy = document.createElement("div"); const title = document.createElement("strong"); title.textContent = report.scam_type; const detail = document.createElement("small"); detail.textContent = report.details.slice(0, 54); copy.append(title, detail);
      const badge = document.createElement("span"); badge.className = "status-pill"; badge.textContent = t(`status${report.status[0].toUpperCase()}${report.status.slice(1).replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())}`); item.append(icon, copy, badge); list.append(item);
    });
  }
  function createEmptyState(container, messageKey = "noData") {
    container.replaceChildren();
    const message = document.createElement("p"); message.className = "input-help"; message.textContent = t(messageKey); container.append(message);
  }
  function renderAdminSections() {
    const users = $("#admin-users-list");
    users.replaceChildren();
    state.profiles.forEach(profile => {
      const row = document.createElement("div"); row.className = "history-row";
      const identity = document.createElement("div");
      const name = document.createElement("strong"); name.textContent = profile.display_name || profile.email;
      const email = document.createElement("small"); email.textContent = profile.email;
      identity.append(name, email);
      const role = document.createElement("span"); role.className = "status-pill"; role.textContent = t(profile.role === "admin" ? "adminRole" : "userRole");
      row.append(identity, role); users.append(row);
    });
    if (!state.profiles.length) createEmptyState(users);

    const reports = $("#admin-reports-list");
    reports.replaceChildren();
    state.reports.forEach(report => {
      const owner = state.profiles.find(profile => profile.id === report.user_id)?.email || report.user_id;
      const row = document.createElement("div"); row.className = "history-row";
      const description = document.createElement("div");
      const title = document.createElement("strong"); title.textContent = report.scam_type;
      const detail = document.createElement("small"); detail.textContent = `${t("reportedBy")}: ${owner} · ${formatDate(report.created_at)} · ${report.details}`;
      description.append(title, detail);
      const status = document.createElement("select"); status.className = "form-select report-status"; status.dataset.reportId = report.id; status.setAttribute("aria-label", t("updateStatus"));
      [["open", "statusOpen"], ["reviewing", "statusReviewing"], ["confirmed", "statusConfirmed"], ["false_positive", "statusFalsePositive"], ["closed", "statusClosed"]].forEach(([value, key]) => { const option = document.createElement("option"); option.value = value; option.textContent = t(key); option.selected = report.status === value; status.append(option); });
      row.append(description, status); reports.append(row);
    });
    if (!state.reports.length) createEmptyState(reports);

    const cases = $("#admin-cases-list");
    cases.replaceChildren();
    state.history.forEach(record => {
      const owner = state.profiles.find(profile => profile.id === record.user_id)?.email || record.user_id;
      const row = document.createElement("div"); row.className = "history-row";
      const detail = document.createElement("div"); const title = document.createElement("strong"); title.textContent = t(record.scamType || "typeOther"); const message = document.createElement("small"); message.textContent = `${owner} · ${formatDate(record.date)} · ${record.message.slice(0, 100)}`; detail.append(title, message);
      const score = document.createElement("span"); score.className = "history-risk"; score.textContent = `${record.score}/100`;
      row.append(detail, score); cases.append(row);
    });
    if (!state.history.length) createEmptyState(cases);

    const trendCounts = state.reports.reduce((counts, report) => { counts[report.scam_type] = (counts[report.scam_type] || 0) + 1; return counts; }, {});
    const trends = $("#admin-trends-list"); trends.replaceChildren();
    Object.entries(trendCounts).sort((a, b) => b[1] - a[1]).forEach(([name, count]) => { const row = document.createElement("div"); row.className = "activity-item"; const title = document.createElement("strong"); title.textContent = name; const total = document.createElement("span"); total.className = "status-pill"; total.textContent = count; row.append(title, total); trends.append(row); });
    if (!Object.keys(trendCounts).length) createEmptyState(trends);

    const performance = $("#admin-performance-list"); performance.replaceChildren();
    const reviewed = state.reports.filter(report => ["confirmed", "false_positive", "closed"].includes(report.status)).length;
    [["casesReviewed", reviewed], ["confirmedCases", state.reports.filter(report => report.status === "confirmed").length], ["falsePositiveCases", state.reports.filter(report => report.status === "false_positive").length]].forEach(([key, value]) => { const row = document.createElement("div"); row.className = "activity-item"; const label = document.createElement("strong"); label.textContent = t(key); const count = document.createElement("span"); count.className = "status-pill"; count.textContent = value; row.append(label, count); performance.append(row); });
  }
  function toast(message) {
    $("#toast-message").textContent = message;
    if (bootstrap) bootstrap.Toast.getOrCreateInstance($("#app-toast"), { delay: 2800 }).show(); else window.alert(message);
  }
  $$("[data-view]").forEach(button => button.addEventListener("click", () => showView(button.dataset.view)));
  $$('[data-go]').forEach(button => button.addEventListener("click", () => showView(button.dataset.go)));
  $$('[data-auth-mode]').forEach(button => button.addEventListener("click", () => setAuthMode(button.dataset.authMode)));
  $$('[data-lang]').forEach(button => button.addEventListener("click", () => setLanguage(button.dataset.lang)));
  $$('[data-analyze]').forEach(button => button.addEventListener("click", () => runAnalysis(button.dataset.analyze)));
  $$('[data-report-open]').forEach(button => button.addEventListener("click", () => {
    if (state.latestResult) {
      const reportType = { typeBank: "Bank impersonation", typeCredential: "Bank impersonation", typeJob: "Job offer", typeDelivery: "SMS / messaging" }[state.latestResult.scamType] || "Other";
      $("#report-type").value = reportType;
      $("#report-details").value = `${state.latestResult.message.slice(0, 360)}\n\n${t("scamTypeTitle")}: ${t(state.latestResult.scamType)} | ${t("scoreLabel")}: ${state.latestResult.score}/100`;
    }
    bootstrap.Modal.getOrCreateInstance($("#report-modal")).show();
  }));
  $("#url-form").addEventListener("submit", event => {
    event.preventDefault();
    const raw = $("#url-input").value.trim();
    let url;
    try { url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`); } catch { toast(t("urlInvalid")); return; }
    if (!/[.:]/.test(url.hostname) || !["http:", "https:"].includes(url.protocol)) { toast(t("urlInvalid")); return; }
    const results = scanUrls(url.href);
    const previous = state.history.some(record => (record.urlChecks || []).some(check => normalizeMessage(check.value) === normalizeMessage(url.href)));
    if (previous && results[0]) results[0].reasons.push("previousMatch");
    renderCheckList($("#single-url-result"), results, "urlNone", check => `${check.reasons.length ? `${t("urlReview")}: ${check.reasons.map(t).join(" ")}` : t("urlUnverified")}`);
  });
  $("#phone-form").addEventListener("submit", event => {
    event.preventDefault();
    const value = $("#phone-input").value.trim();
    const number = scanPhoneNumbers(value)[0];
    if (!number) { toast(t("phoneInvalid")); return; }
    const normalized = number.value.replace(/\D/g, "");
    const previous = state.history.find(record => (record.phoneChecks || []).some(check => check.value.replace(/\D/g, "") === normalized));
    const results = [{ ...number, previous: Boolean(previous) }];
    renderCheckList($("#single-phone-result"), results, "phoneNone", check => `${t(check.validFormat ? "phoneValid" : "phoneInvalid")} ${t("phoneNoLookup")}${check.previous ? ` ${t("previousMatch")}` : ""}`);
  });
  $("#admin-reports-list").addEventListener("change", async event => {
    const select = event.target.closest("[data-report-id]");
    if (!select || state.profile?.role !== "admin") return;
    try {
      await apiRequest(`/api/admin/reports/${select.dataset.reportId}`, { method: "PATCH", body: { status: select.value } });
      const report = state.reports.find(item => String(item.id) === select.dataset.reportId);
      if (report) report.status = select.value;
      updateDashboard();
    } catch (error) {
      toast(error.message);
    }
  });
  $("#admin-invite-form").addEventListener("submit", async event => {
    event.preventDefault();
    if (state.profile?.role !== "admin") { toast(t("adminOnly")); return; }
    const form = event.currentTarget;
    try {
      await apiRequest("/api/admin/promote", { method: "POST", body: { email: $("#admin-invite-email").value.trim() } });
      form.reset();
      toast(t("inviteSent"));
      await loadAccountData();
    } catch (error) {
      toast(error.message);
    }
  });
  $("[data-action='invite-admin']").addEventListener("click", () => showView("admin-users"));
  $("[data-action='delete-own-history']").addEventListener("click", async () => {
    if (!state.authUser) return;
    try {
      await apiRequest("/api/cases", { method: "DELETE" });
      state.history = []; state.checks = []; updateDashboard(); toast(t("historyCleared"));
    } catch (error) {
      toast(error.message);
    }
  });
  $("#history-list").addEventListener("click", event => {
    const button = event.target.closest("[data-history-id]");
    const record = state.history.find(item => item.id === button?.dataset.historyId);
    if (record) { const result = analyzeMessage(record.message); result.previousMatch = null; result.id = record.id; result.date = record.date; renderResult(result, false); }
  });
  let liveAnalysisTimer;
  function updateLiveAnalysis(message) {
    const result = analyzeMessage(message);
    const preview = $("#live-analysis");
    const color = result.level === "high" ? "#bc5943" : result.level === "medium" ? "#b47b18" : "#267358";
    preview.style.setProperty("--risk-color", color);
    preview.textContent = `${t("riskLevel")}: ${result.title} · ${t("scoreLabel")}: ${result.score}/100`;
    preview.hidden = false;
  }
  $("#analyzer-message").addEventListener("input", event => {
    const message = event.target.value.trim();
    $("#char-count").textContent = `${event.target.value.length} / 5000`;
    window.clearTimeout(liveAnalysisTimer);
    if (!message) { $("#live-analysis").hidden = true; return; }
    liveAnalysisTimer = window.setTimeout(() => updateLiveAnalysis(message), 450);
  });
  const examples = {
    urgent:"URGENT: Your bank account will be suspended today. Verify your PIN now at https://bit.ly/verify-account or access will be blocked.",
    prize:"Congratulations! You have won a free gift. Pay a small processing fee now to claim your prize: www.claim-reward.example",
    safe:"Your delivery is scheduled for tomorrow between 10:00 and 12:00. Track your parcel in the courier app you already use."
  };
  $$('[data-example]').forEach(button => button.addEventListener("click", () => {
    $("#analyzer-message").value = examples[button.dataset.example];
    $("#analyzer-message").dispatchEvent(new Event("input", { bubbles: true }));
  }));
  $("#auth-form").addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const registering = form.dataset.mode === "register";
    const email = $("#auth-email").value.trim().toLowerCase();
    const password = $("#auth-password").value;
    const submitButton = $("#auth-submit");
    submitButton.disabled = true;
    try {
      if (registering) {
        if (password !== $("#auth-confirm").value) { $("#auth-confirm").setCustomValidity(t("passwordMismatch")); $("#auth-confirm").reportValidity(); $("#auth-confirm").setCustomValidity(""); return; }
        const { profile } = await apiRequest("/api/auth/register", { method: "POST", body: { email, password, display_name: $("#auth-name").value.trim() } });
        form.reset();
        setAuthMode("login");
        await activateUser(profile);
        toast(t("accountCreated"));
      } else {
        const { profile } = await apiRequest("/api/auth/login", { method: "POST", body: { email, password, admin: form.dataset.mode === "admin" } });
        form.reset();
        await activateUser(profile);
        toast(t("loginSuccess"));
      }
    } catch (error) {
      toast(error.message || t("profileLoadFailed"));
    } finally {
      submitButton.disabled = false;
    }
  });
  $("#logout-button").addEventListener("click", async () => {
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
    } catch (error) {
      toast(error.message);
    }
    state.authUser = null; state.profile = null; state.history = []; state.reports = []; state.checks = []; state.profiles = [];
    updateAuthActions(); updateDashboard(); showView("auth");
  });
  $("#report-form").addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!state.authUser) { showView("auth"); return; }
    try {
      const { item } = await apiRequest("/api/reports", { method: "POST", body: { case_id: state.latestResult?.id || null, scam_type: $("#report-type").value, details: $("#report-details").value.trim() } });
      state.reports.unshift(item); updateDashboard(); form.reset(); bootstrap.Modal.getOrCreateInstance($("#report-modal")).hide(); toast(t("reportSaved"));
    } catch (error) {
      toast(error.message);
    }
  });
  $("#copy-report").addEventListener("click", async () => {
    const text = `${t("scoreLabel")}: ${state.latestResult?.score ?? 0}/100 - ${state.latestResult?.title ?? ""}\n${state.latestResult?.summary ?? ""}\n${state.latestResult?.advice ?? ""}`;
    try { await navigator.clipboard.writeText(text); toast(t("copied")); } catch { toast(t("copyFail")); }
  });
  setLanguage("en"); setAuthMode("login"); updateAuthActions(); updateDashboard(); restoreSession();
}
