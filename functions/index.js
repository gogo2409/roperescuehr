const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// Funkcija se automatski pokreće kad se doda novi exam_result
exports.sendExamPassedEmail = functions.firestore
  .document('exam_results/{resultId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    
    // Provjeri je li korisnik položio (90%+)
    if (data.percentage >= 90) {
      // Pošalji email
      const mailOptions = {
        from: 'noreply@tvoja-domena.com',
        to: data.userEmail,
        subject: '🎉 Čestitamo! Položili ste ispit!',
        html: `
          <h1>Bravo ${data.userName}!</h1>
          <p>Uspješno ste položili ispit za Modul ${data.modulId}</p>
          <p><strong>Vaš rezultat: ${data.percentage}%</strong></p>
        `
      };
      
      await transporter.sendMail(mailOptions);
    }
  });