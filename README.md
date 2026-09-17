# 🎂 DOB & Birthday Reminder Web App (Personal Contact + Birthday Management System)

> **एक सुरक्षित, जलद आणि मोबाईल-फ्रेंडली वैयक्तिक संपर्क आणि वाढदिवस स्मरण प्रणाली.**  
> Built with HTML5, Tailwind CSS, ES6 Modules, PWA (Progressive Web App), Google Firebase (Auth + Cloud Firestore + Notifications), and deployed seamlessly on Vercel.

---

## 🌟 मुख्य वैशिष्ट्ये (Features)

1. 🌐 **Online Web App & PWA**:
   - Vercel वर विनामूल्य होस्टिंग.
   - मोबाईल आणि कॉम्प्युटर दोन्हीवर जलद आणि रिस्पॉन्सिव्ह कार्य.
   - इंटरनेट नसतानाही कॅशिंग आणि 'Add to Home Screen' करून एका मोबाईल ॲपप्रमाणे वापर.

2. 🔐 **Firebase Authentication & Multi-Tenant Data**:
   - Google Sign-in आणि Email Login.
   - प्रत्येक युजरचा डेटा Firestore मध्ये स्वतंत्र आणि सुरक्षित (`users/{userId}/contacts`).

3. 🗄️ **Live Cloud Firestore Database**:
   - नाव (Full Name)
   - जन्मतारीख (Date of Birth)
   - जन्मवेळ (Birth Time)
   - जन्मस्थळ (Birth Place)
   - मोबाईल नंबर (Mobile / WhatsApp)
   - वर्गवारी (Category: कुटुंब, मित्र, नातेवाईक, सहकारी, व्यवसाय, इतर)
   - अतिरिक्त माहिती/नोट्स (Notes)
   - रिअल-टाईम सिंक (मोबाईलवर बदल केल्यास कॉम्प्युटरवर तत्काळ अपडेट).

4. 🎂 **Smart Birthday Engine**:
   - आज कोणाचा वाढदिवस आहे (Today's Birthdays)
   - उद्या कोणाचा वाढदिवस आहे (Tomorrow's Birthdays)
   - या महिन्यातील वाढदिवस (This Month)
   - चालू वय आणि पुढील वाढदिवसाचे वय (उदा. "३२ वर्षे पूर्ण, ३३ वे वर्ष")
   - दिवस शिल्लक (Countdown)
   - दरवर्षी आपोआप repeat होणारे चक्र (लीप वर्ष २९ फेब्रुवारी अचूक हाताळणी).

5. 🔔 **Notifications (स्मरणपत्रे)**:
   - १ दिवस आधी पूर्वसूचना ("उद्या अमोल पाटील यांचा वाढदिवस आहे 🎂").
   - वाढदिवसाच्या दिवशी सूचना ("आज अमोल पाटील यांचा वाढदिवस आहे 🎉").

6. 📱 **1-Click WhatsApp Sharing**:
   - प्रत्येक संपर्कासमोर थेट WhatsApp बटण.
   - सुंदर मराठी शुभेच्छा संदेश:
     > सस्नेह नमस्कार! 🙏💐  
     > आदरणीय अमोल पाटील यांना वाढदिवसाच्या मनःपूर्वक हार्दिक शुभेच्छा! 🎂🎉  
     > ईश्वर आपणास उदंड दीर्घायुष्य, उत्तम आरोग्य, सुख आणि उत्तुंग यश देवो हीच प्रार्थना! ✨🚩
   - चार तयार टेम्प्लेट्स: Formal, Friendly, Blessings (लहान मुले), Short.
   - थेट ॲप उघडणे किंवा मेसेज कॉपी करण्याची सोय.

7. 🔎 **Search & Filter**:
   - नावाने (मराठी/इंग्रजी), मोबाईल नंबरने किंवा जन्मतारखेने झटपट शोध.
   - ५००+ नोंदींमध्येही ०.१ सेकंदात रिझल्ट्स.

8. 💾 **Backup & Excel Support**:
   - एक्सेल / CSV फाईलमध्ये सर्व नोंदी एक्सपोर्ट करणे.
   - CSV फाईलवरून आधीची यादी थेट इम्पोर्ट करणे.

---

## 🚀 स्थानिक पातळीवर कसे चालवायचे (How to Run Locally)

आपल्या कॉम्प्युटरमध्ये Python 3.14 आधीच उपलब्ध आहे. खालील कमांडने ॲप त्वरित सुरू करा:

```bash
cd "C:\Users\student\.gemini\antigravity\scratch\dob-birthday-reminder"
python -m http.server 3000
```

त्यानंतर कोणत्याही ब्राउझरमध्ये उघडा:
👉 **http://localhost:3000**

---

## 🔥 Firebase कसे जोडायचे (Firebase Setup Guide)

ॲपमध्ये **डेमो मोड (Demo Mode)** आधीपासूनच सुरू आहे. जर तुम्हाला लाईव्ह क्लाऊड सिंक हवे असेल:

1. [Firebase Console](https://console.firebase.google.com/) वर जा.
2. **'Add Project'** वर क्लिक करा (उदा. `my-dob-reminder`).
3. डाव्या बाजूला **Build > Authentication** वर क्लिक करा आणि **Google** किंवा **Email/Password** चालू (Enable) करा.
4. **Build > Firestore Database** वर क्लिक करा आणि डेटाबेस तयार करा.
5. **Project Settings (गिअर आयकॉन)** > **General** > खाली **'Your apps'** मध्ये **Web (</>)** आयकॉन निवडून ॲप रजिस्टर करा.
6. तेथे दिसणारा `firebaseConfig` कोड कॉपी करा:
   ```json
   {
     "apiKey": "AIzaSy...",
     "authDomain": "my-dob.firebaseapp.com",
     "projectId": "my-dob",
     "storageBucket": "my-dob.appspot.com",
     "messagingSenderId": "12345...",
     "appId": "1:12345:web:abc..."
   }
   ```
7. ॲपमध्ये वर उजव्या कोपऱ्यातील **⚙️ Settings** बटण दाबा.
8. तो कोड पेस्ट करून **'Firebase सेव्ह करा'** बटण दाबा. ॲप आपोआप Live Firebase शी कनेक्ट होईल!

---

## 🌐 Vercel वर कसे डिप्लॉय करायचे (Vercel Deployment)

प्रकल्पामध्ये `vercel.json` आधीच कॉन्फिगर केलेला आहे.

### पर्याय १: GitHub द्वारे (Recommended)
1. हा फोल्डर तुमच्या GitHub रिपॉझिटरीमध्ये पुश करा.
2. [Vercel.com](https://vercel.com) वर लॉगिन करा.
3. **'Add New Project'** वर क्लिक करून तुमची GitHub Repo निवडा.
4. Framework Preset: **'Other'** किंवा **'Static'** राहू द्या.
5. **'Deploy'** बटण दाबा! अवघ्या २० सेकंदात तुमची लाईव्ह लिंक तयार होईल (उदा. `dob-reminder.vercel.app`).

### पर्याय २: Vercel CLI द्वारे
```bash
npm i -g vercel
cd "C:\Users\student\.gemini\antigravity\scratch\dob-birthday-reminder"
vercel --prod
```
