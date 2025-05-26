import cron from 'node-cron';
import userModel from '../../DB/models/User.model';
import notificationModel from '../../DB/models/Notification.model';
import { sendNotification } from '../../services/firebase.js';

cron.schedule('0 0 * * *', async () => {
  const today = new Date();
  const notifyDays = [40, 20, 5];

  try {
    const employees = await userModel.find({ documents: { $exists: true, $ne: [] } });

    for (const employee of employees) {
      for (const doc of employee.documents) {
        const endDate = new Date(doc.end);
        const diffTime = endDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (notifyDays.includes(diffDays)) {
          const message = {
            en: `Document Expiry Warning`,
            ar: `تحذير: انتهاء صلاحية المستند`,
            bn: `নথির মেয়াদ শেষ হওয়ার সতর্কতা`
          };

          const description = {
            en: `Document "${doc.title?.en || 'Unknown'}" for employee ${employee.name?.en || 'Unknown'} is expiring in ${diffDays} day(s).`,
            ar: `المستند "${doc.title?.ar || 'غير معروف'}" للموظف ${employee.name?.ar || 'غير معروف'} سينتهي خلال ${diffDays} يومًا.`,
            bn: `কর্মচারী ${employee.name?.bn || 'অজানা'} এর "${doc.title?.bn || 'অজানা'}" নথির মেয়াদ শেষ হবে ${diffDays} দিনের মধ্যে।`
          };

          const admins = await userModel.find({ role: { $in: ['admin', 'assistant'] } });

          for (const admin of admins) {
            await notificationModel.create({
              employee: admin._id,
              message,
              description
            });

            // Send real-time/push notification (optional)
            sendNotification(admin._id, message, description);         
          }
        }
      }
    }

    console.log('Document expiry multilingual check completed.');
  } catch (err) {
    console.error('Error in cron job:', err.message);
  }
});
