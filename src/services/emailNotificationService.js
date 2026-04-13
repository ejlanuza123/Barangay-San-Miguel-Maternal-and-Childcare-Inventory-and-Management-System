const EMAILJS_ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send";

const getConfig = () => ({
  serviceId: process.env.REACT_APP_EMAILJS_SERVICE_ID,
  templateId: process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
  publicKey: process.env.REACT_APP_EMAILJS_PUBLIC_KEY,
  fromName: process.env.REACT_APP_EMAIL_FROM_NAME || "Barangay San Miguel MCIMS",
});

export const isEmailNotificationConfigured = () => {
  const { serviceId, templateId, publicKey } = getConfig();
  return Boolean(serviceId && templateId && publicKey);
};

export const sendEmailNotification = async ({
  toEmail,
  toName,
  subject,
  message,
}) => {
  if (!toEmail) {
    throw new Error("Recipient email is required.");
  }

  const { serviceId, templateId, publicKey, fromName } = getConfig();
  if (!serviceId || !templateId || !publicKey) {
    throw new Error(
      "Email notifications are not configured. Add EmailJS environment variables first."
    );
  }

  const response = await fetch(EMAILJS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      template_params: {
        to_email: toEmail,
        to_name: toName || "User",
        from_name: fromName,
        subject,
        message,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to send email notification.");
  }

  return true;
};
