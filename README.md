Done with authentication (register/login via collegeId + JWT), RBAC middleware (protect + restrictTo), course creation by professor, student enrollment, and get all users for professor and TA. Models for User and Course are also finalized with all required fields.

new requirement - npm install json2csv csvtojson


2. The Grading Engine (Architecture)
Normalized Database Schema: Built a dedicated Grade model to keep the database fast, tracking individual components (quizzes, midsem, endsem) and final scores.

Auto-Generation: Wired the enrollment endpoint to automatically spin up a blank, fresh grade sheet the moment a student joins a course.

Academic Audit Logs: Implemented an automated tracking system that records exactly who (Professor or TA) changed a grade, what they changed, and when they changed it.

3. Business Logic & Automation
Weighted Math: Wrote automated calculation logic that takes the professor's custom course weights (e.g., Midsem = 30%, Endsem = 40%) and instantly recalculates the student's final score whenever a TA updates a quiz.

Role-Based Guardrails: Created strict security checks so TAs can grade components, but only the Professor can assign the official Final Letter Grade and hit the "Publish" button.

The Release Switch: Built a toggle system that keeps grades hidden from students until the professor explicitly releases them.

4. Enterprise-Level Features
Bulk CSV Operations: Integrated json2csv and csvtojson to allow professors to download the entire class roster as a spreadsheet, grade offline, and upload the file to update the entire database at once.
