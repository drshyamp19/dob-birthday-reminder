// WhatsApp Wish Message Generator & Sharer

export const WISH_TEMPLATES = {
  formal: {
    id: 'formal',
    title: 'आदरणीय / सस्नेह (Formal)',
    text: (name, age) => 
`सस्नेह नमस्कार! 🙏💐

आदरणीय {NAME} यांना वाढदिवसाच्या मनःपूर्वक हार्दिक शुभेच्छा! 🎂🎉
${age ? `आपल्या वयाच्या {AGE} व्या वर्षात पदार्पणाबद्दल अभिनंदन!` : ''}

ईश्वर आपणास उदंड दीर्घायुष्य, उत्तम आरोग्य, सुख, समाधान आणि उत्तुंग यश देवो हीच ईश्वरचरणी प्रार्थना! ✨🚩`
  },

  friendly: {
    id: 'friendly',
    title: 'मित्र / सवंगडी (Friendly)',
    text: (name, age) => 
`प्रिय {NAME}, वाढदिवसाच्या खूप खूप शुभेच्छा! 🎂🥳🎉
${age ? `वाढदिवसाचा {AGE} वा टप्पा गाठल्याबद्दल खूप अभिनंदन!` : ''}

हे नवीन वर्ष तुझ्या आयुष्यात सुख, समृद्धी, यश आणि खूप सारा आनंद घेऊन येवो! नेहमी हसत राहा आणि यशस्वी हो! 🎁🍻
पार्टी कधी देतोयस? 😉🍕`
  },

  blessings: {
    id: 'blessings',
    title: 'आशीर्वाद / लहान मुलांसाठी (Blessings)',
    text: (name, age) => 
`{NAME} बाळाला वाढदिवसाच्या उदंड शुभेच्छा आणि खूप खूप आशीर्वाद! 🎂🎈✨

तू आयुष्यात खूप मोठा हो, उत्तम शिक्षण व यश मिळव आणि आई-वडिलांचे नाव उज्ज्वल कर हीच सदिच्छा! 🌸🙏`
  },

  short: {
    id: 'short',
    title: 'छोटा संदेश (Short & Sweet)',
    text: (name) => 
`{NAME} यांना वाढदिवसाच्या हार्दिक शुभेच्छा! 🎂💐 
तुमचे आयुष्य सुख, समृद्धी आणि आनंदाने भरून जावो. 🙏✨`
  }
};

export function cleanPhoneNumber(mobile) {
  if (!mobile) return '';
  // Remove all non-numeric characters
  let cleaned = mobile.toString().replace(/\D/g, '');
  // If 10 digits (India), add 91 prefix
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return cleaned;
}

export function generateWishMessage(name, age = null, templateKey = 'formal', customOverride = null) {
  if (customOverride && customOverride.trim().length > 0) {
    return customOverride
      .replace(/{NAME}/g, name || 'स्नेही')
      .replace(/{AGE}/g, age ? age.toString() : '');
  }

  const template = WISH_TEMPLATES[templateKey] || WISH_TEMPLATES.formal;
  const rawText = template.text(name, age);
  return rawText
    .replace(/{NAME}/g, name || 'स्नेही')
    .replace(/{AGE}/g, age ? age.toString() : '');
}

export function getWhatsAppLink(mobile, message) {
  const cleanedPhone = cleanPhoneNumber(mobile);
  const encodedText = encodeURIComponent(message);
  if (cleanedPhone) {
    return `https://wa.me/${cleanedPhone}?text=${encodedText}`;
  }
  // If no phone number, open general WhatsApp share link
  return `https://wa.me/?text=${encodedText}`;
}

export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (err) {
    console.error('Clipboard copy failed:', err);
    return false;
  }
}
