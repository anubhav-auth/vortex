import { prisma } from '../config/db.js';
import { sendMail, generateOTP, generateRandomPassword } from '../utils/mail.js';

export const registerStudent = async (req, res, next) => {
  try {
    const { fullName, rollNumber, email, phone, gender, institutionId, domainId, psId, summary, photo } = req.body;

    const existing = await prisma.student.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'EMAIL_ALREADY_LINKED' });

    const existingRoll = await prisma.student.findUnique({ where: { rollNumber: rollNumber || 'N/A' } });
    if (existingRoll && rollNumber) return res.status(400).json({ error: 'ROLL_NUMBER_ALREADY_LINKED' });

    const otp = generateOTP();

    const student = await prisma.student.create({
      data: { 
        fullName, 
        rollNumber,
        email, 
        phone,
        gender, 
        instituteId: institutionId, 
        domainId, 
        psId, 
        summary,
        photo,
        otp,
        verificationStatus: 'PENDING',
        role: 'STUDENT'
      },
    });

    await sendMail({
      to: email,
      subject: '[VORTEX] OTP_VERIFICATION_REQUIRED',
      text: `Your tactical verification code is: ${otp}`
    });

    res.status(201).json({ 
      message: 'REGISTRATION_INITIATED: CHECK_EMAIL_FOR_OTP', 
      studentId: student.id 
    });
  } catch (err) {
    next(err);
  }
};

export const verifyOTP = async (req, res, next) => {
  try {
    const { studentId, otp } = req.body;
    const student = await prisma.student.findUnique({ where: { id: studentId } });

    if (!student) return res.status(404).json({ error: 'PARTICIPANT_NOT_FOUND' });
    if (student.otp !== otp) return res.status(400).json({ error: 'INVALID_OTP' });

    await prisma.student.update({
      where: { id: studentId },
      data: { otpVerified: true, otp: null }
    });

    await sendMail({
      to: student.email,
      subject: '[VORTEX] REGISTRATION_PENDING_REVIEW',
      text: `Registration received. Admin review in progress. You will be notified shortly.`
    });

    res.json({ message: 'OTP_VERIFIED: AWAITING_ADMIN_VERIFICATION' });
  } catch (err) {
    next(err);
  }
};

export const adminVerifyStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // VERIFIED or REJECTED

    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) return res.status(404).json({ error: 'PARTICIPANT_NOT_FOUND' });

    if (status === 'VERIFIED') {
      const password = generateRandomPassword();
      await prisma.student.update({
        where: { id },
        data: { 
          verificationStatus: 'VERIFIED',
          password // In real app, hash this
        }
      });

      await sendMail({
        to: student.email,
        subject: '[VORTEX] ACCESS_GRANTED: SQUAD_UPLINK_ESTABLISHED',
        text: `Clearance granted. Credentials for deployment:\nEMAIL: ${student.email}\nKEY: ${password}\n\nUplink at: http://vortex.system`
      });
    } else {
      await prisma.student.update({
        where: { id },
        data: { verificationStatus: 'REJECTED' }
      });
      await sendMail({
        to: student.email,
        subject: '[VORTEX] CLEARANCE_DENIED',
        text: `Your operative registration has been rejected by mission control.`
      });
    }

    res.json({ message: `OPERATIVE_STATUS_UPDATED: ${status}` });
  } catch (err) {
    next(err);
  }
};

export const getAllOperatives = async (req, res, next) => {
  try {
    const { status, instituteId, domainId, psId, search } = req.query;
    const where = {};
    if (status) where.verificationStatus = status;
    if (instituteId) where.instituteId = instituteId;
    if (domainId) where.domainId = domainId;
    if (psId) where.psId = psId;
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const students = await prisma.student.findMany({
      where,
      include: { 
        institute: true, 
        domain: true, 
        problemStatement: true 
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ count: students.length, operatives: students });
  } catch (err) {
    next(err);
  }
};

export const getStudentById = async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.id },
      include: {
        institute: true,
        domain: true,
        problemStatement: true
      }
    });

    if (!student) return res.status(404).json({ error: 'PARTICIPANT_NOT_FOUND' });
    res.json(student);
  } catch (err) {
    next(err);
  }
};
