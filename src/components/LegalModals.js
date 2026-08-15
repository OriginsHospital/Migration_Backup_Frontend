import React, { useState } from 'react'
import {
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
} from '@mui/material'
import {
  Phone,
  Email,
  LocationOn,
  AccessTime,
  Send,
  Close,
} from '@mui/icons-material'
import { useDispatch } from 'react-redux'
import { closeModal } from '@/redux/modalSlice'

// Terms and Conditions Modal Content
export const TermsAndConditionsContent = () => {
  const dispatch = useDispatch()

  return (
    <Box className="p-6 max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <Typography
          variant="h4"
          component="h1"
          className="text-secondary font-bold"
        >
          Terms and Conditions
        </Typography>
        <IconButton onClick={() => dispatch(closeModal())}>
          <Close />
        </IconButton>
      </div>

      <Typography variant="body1" paragraph className="text-gray-600 mb-4">
        Last updated: {new Date().toLocaleDateString()}
      </Typography>

      <Box className="space-y-6">
        <section>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            className="text-secondary font-semibold"
          >
            1. Acceptance of Terms
          </Typography>
          <Typography variant="body1" paragraph>
            By accessing and using this Hospital Management System (HMS), you
            accept and agree to be bound by the terms and provision of this
            agreement. If you do not agree to abide by the above, please do not
            use this service.
          </Typography>
        </section>

        <section>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            className="text-secondary font-semibold"
          >
            2. Use License
          </Typography>
          <Typography variant="body1" paragraph>
            Permission is granted to temporarily access the materials
            (information or software) on the Hospital Management System for
            personal, non-commercial transitory viewing only. This is the grant
            of a license, not a transfer of title, and under this license you
            may not:
          </Typography>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Modify or copy the materials</li>
            <li>
              Use the materials for any commercial purpose or for any public
              display
            </li>
            <li>
              Attempt to reverse engineer any software contained on the system
            </li>
            <li>
              Remove any copyright or other proprietary notations from the
              materials
            </li>
            <li>
              {` Transfer the materials to another person or "mirror" the materials
              on any other server`}
            </li>
          </ul>
        </section>

        <section>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            className="text-secondary font-semibold"
          >
            3. Medical Information Disclaimer
          </Typography>
          <Typography variant="body1" paragraph>
            The information provided through this Hospital Management System is
            for general informational purposes only. It is not intended as a
            substitute for professional medical advice, diagnosis, or treatment.
            Always seek the advice of your physician or other qualified health
            provider with any questions you may have regarding a medical
            condition.
          </Typography>
        </section>

        <section>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            className="text-secondary font-semibold"
          >
            4. User Responsibilities
          </Typography>
          <Typography variant="body1" paragraph>
            As a user of this system, you are responsible for:
          </Typography>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Maintaining the confidentiality of your account credentials</li>
            <li>All activities that occur under your account</li>
            <li>Providing accurate and complete information</li>
            <li>Complying with all applicable laws and regulations</li>
            <li>Not sharing your login credentials with others</li>
          </ul>
        </section>

        <section>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            className="text-secondary font-semibold"
          >
            5. Data Security and Privacy
          </Typography>
          <Typography variant="body1" paragraph>
            We are committed to protecting your privacy and maintaining the
            security of your personal and medical information. Our data
            collection and usage practices are outlined in our Privacy Policy.
            By using this system, you consent to the collection and use of
            information as described in our Privacy Policy.
          </Typography>
        </section>

        <section>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            className="text-secondary font-semibold"
          >
            6. System Availability
          </Typography>
          <Typography variant="body1" paragraph>
            We strive to maintain system availability but cannot guarantee
            uninterrupted access. The system may be temporarily unavailable due
            to maintenance, updates, or technical issues. We are not liable for
            any damages resulting from system unavailability.
          </Typography>
        </section>

        <section>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            className="text-secondary font-semibold"
          >
            7. Limitation of Liability
          </Typography>
          <Typography variant="body1" paragraph>
            In no event shall the hospital or its suppliers be liable for any
            damages (including, without limitation, damages for loss of data or
            profit, or due to business interruption) arising out of the use or
            inability to use the Hospital Management System, even if the
            hospital or a hospital authorized representative has been notified
            orally or in writing of the possibility of such damage.
          </Typography>
        </section>

        <section>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            className="text-secondary font-semibold"
          >
            8. Revisions and Errata
          </Typography>
          <Typography variant="body1" paragraph>
            The materials appearing on the Hospital Management System could
            include technical, typographical, or photographic errors. We do not
            warrant that any of the materials on the system are accurate,
            complete, or current. We may make changes to the materials contained
            on the system at any time without notice.
          </Typography>
        </section>

        <section>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            className="text-secondary font-semibold"
          >
            9. Links
          </Typography>
          <Typography variant="body1" paragraph>
            {` The Hospital Management System has not reviewed all of the sites
                        linked to its website and is not responsible for the contents of any
                        such linked site. The inclusion of any link does not imply
                        endorsement by the hospital of the site. Use of any such linked
                        website is at the user's own risk.`}
          </Typography>
        </section>

        <section>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            className="text-secondary font-semibold"
          >
            10. Modifications
          </Typography>
          <Typography variant="body1" paragraph>
            We may revise these terms of service for the Hospital Management
            System at any time without notice. By using this system, you are
            agreeing to be bound by the then current version of these Terms and
            Conditions of Use.
          </Typography>
        </section>

        <section>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            className="text-secondary font-semibold"
          >
            11. Governing Law
          </Typography>
          <Typography variant="body1" paragraph>
            These terms and conditions are governed by and construed in
            accordance with the laws of the jurisdiction where the hospital is
            located, and you irrevocably submit to the exclusive jurisdiction of
            the courts in that location.
          </Typography>
        </section>

        <section>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            className="text-secondary font-semibold"
          >
            12. Contact Information
          </Typography>
          <Typography variant="body1" paragraph>
            If you have any questions about these Terms and Conditions, please
            contact us at:
          </Typography>
          <Box className="bg-gray-50 p-4 rounded-lg">
            <Typography variant="body1">
              <strong>Email:</strong> originsivf@gmail.com
              <br />
            </Typography>
          </Box>
        </section>
      </Box>
    </Box>
  )
}

// Privacy Policy Modal Content
export const PrivacyPolicyContent = () => {
  const dispatch = useDispatch()

  return (
    <Box className="p-6 max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <Typography
          variant="h4"
          component="h1"
          className="text-secondary font-bold"
        >
          Privacy Policy
        </Typography>
        <IconButton onClick={() => dispatch(closeModal())}>
          <Close />
        </IconButton>
      </div>

      <Typography variant="body1" paragraph className="text-gray-600 mb-4">
        Last updated: {new Date().toLocaleDateString()}
      </Typography>

      <Box className="space-y-6">
        <section>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            className="text-secondary font-semibold"
          >
            1. Introduction
          </Typography>
          <Typography variant="body1" paragraph>
            This Privacy Policy describes how our Hospital Management System
            (HMS) collects, uses, and protects your personal and medical
            information. We are committed to maintaining the privacy and
            security of your health information in accordance with applicable
            laws and regulations, including HIPAA (Health Insurance Portability
            and Accountability Act).
          </Typography>
        </section>

        <section>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            className="text-secondary font-semibold"
          >
            2. Information We Collect
          </Typography>
          <Typography variant="body1" paragraph>
            We collect the following types of information:
          </Typography>

          <Typography
            variant="h6"
            component="h3"
            gutterBottom
            className="text-secondary font-medium"
          >
            2.1 Personal Information
          </Typography>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li>Name, date of birth, and contact information</li>
            <li>Address and emergency contact details</li>
            <li>Insurance information</li>
            <li>Employment information (if applicable)</li>
          </ul>

          <Typography
            variant="h6"
            component="h3"
            gutterBottom
            className="text-secondary font-medium"
          >
            2.2 Medical Information
          </Typography>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li>Medical history and current conditions</li>
            <li>Treatment plans and medications</li>
            <li>Test results and laboratory data</li>
            <li>Appointment schedules and visit records</li>
            <li>Billing and payment information</li>
          </ul>

          <Typography
            variant="h6"
            component="h3"
            gutterBottom
            className="text-secondary font-medium"
          >
            2.3 Technical Information
          </Typography>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>IP address and device information</li>
            <li>Browser type and version</li>
            <li>System usage patterns and preferences</li>
            <li>Cookies and session data</li>
          </ul>
        </section>

        <section>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            className="text-secondary font-semibold"
          >
            3. How We Use Your Information
          </Typography>
          <Typography variant="body1" paragraph>
            We use your information for the following purposes:
          </Typography>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Providing medical care and treatment</li>
            <li>Managing appointments and scheduling</li>
            <li>Processing payments and insurance claims</li>
            <li>Communicating with you about your care</li>
            <li>Improving our services and system functionality</li>
            <li>Complying with legal and regulatory requirements</li>
            <li>Conducting research and quality improvement activities</li>
          </ul>
        </section>

        <section>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            className="text-secondary font-semibold"
          >
            4. Information Sharing and Disclosure
          </Typography>
          <Typography variant="body1" paragraph>
            We may share your information in the following circumstances:
          </Typography>

          <Typography
            variant="h6"
            component="h3"
            gutterBottom
            className="text-secondary font-medium"
          >
            4.1 With Your Consent
          </Typography>
          <Typography variant="body1" paragraph>
            We will obtain your written consent before sharing your medical
            information for purposes not covered by this policy, except as
            required by law.
          </Typography>

          <Typography
            variant="h6"
            component="h3"
            gutterBottom
            className="text-secondary font-medium"
          >
            4.2 For Treatment, Payment, and Healthcare Operations
          </Typography>
          <Typography variant="body1" paragraph>
            We may share your information with healthcare providers involved in
            your care, insurance companies for payment purposes, and for
            internal healthcare operations.
          </Typography>

          <Typography
            variant="h6"
            component="h3"
            gutterBottom
            className="text-secondary font-medium"
          >
            4.3 Legal Requirements
          </Typography>
          <Typography variant="body1" paragraph>
            We may disclose your information when required by law, such as in
            response to court orders, subpoenas, or other legal processes.
          </Typography>

          <Typography
            variant="h6"
            component="h3"
            gutterBottom
            className="text-secondary font-medium"
          >
            4.4 Public Health and Safety
          </Typography>
          <Typography variant="body1" paragraph>
            We may disclose information to public health authorities for disease
            prevention and control, or to prevent serious threats to health or
            safety.
          </Typography>
        </section>

        <section>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            className="text-secondary font-semibold"
          >
            5. Data Security
          </Typography>
          <Typography variant="body1" paragraph>
            We implement appropriate technical and organizational measures to
            protect your information against unauthorized access, alteration,
            disclosure, or destruction. These measures include:
          </Typography>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Encryption of data in transit and at rest</li>
            <li>Regular security assessments and updates</li>
            <li>Access controls and authentication mechanisms</li>
            <li>Employee training on privacy and security</li>
            <li>Incident response and breach notification procedures</li>
          </ul>
        </section>

        <section>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            className="text-secondary font-semibold"
          >
            6. Your Rights
          </Typography>
          <Typography variant="body1" paragraph>
            You have the following rights regarding your health information:
          </Typography>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>
              <strong>Right to Access:</strong> Request copies of your medical
              records
            </li>
            <li>
              <strong>Right to Amend:</strong> Request corrections to your
              information
            </li>
            <li>
              <strong>Right to Restrict:</strong> Limit how we use or share your
              information
            </li>
            <li>
              <strong>Right to Confidential Communications:</strong> Request
              alternative communication methods
            </li>
            <li>
              <strong>Right to Accounting:</strong> Receive a list of
              disclosures of your information
            </li>
            <li>
              <strong>Right to Complain:</strong> File a complaint if you
              believe your rights have been violated
            </li>
          </ul>
        </section>

        <section>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            className="text-secondary font-semibold"
          >
            7. Data Retention
          </Typography>
          <Typography variant="body1" paragraph>
            We retain your health information for as long as necessary to
            provide healthcare services and comply with legal requirements.
            Medical records are typically retained for a minimum of 7 years, or
            longer as required by state law.
          </Typography>
        </section>

        <section>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            className="text-secondary font-semibold"
          >
            8. Cookies and Tracking Technologies
          </Typography>
          <Typography variant="body1" paragraph>
            We use cookies and similar technologies to enhance your experience
            on our system. These technologies help us:
          </Typography>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Remember your preferences and settings</li>
            <li>Analyze system usage and performance</li>
            <li>Provide personalized content and features</li>
            <li>Ensure system security and prevent fraud</li>
          </ul>
          <Typography variant="body1" paragraph>
            You can control cookie settings through your browser preferences,
            though disabling certain cookies may affect system functionality.
          </Typography>
        </section>

        <section>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            className="text-secondary font-semibold"
          >
            9. Third-Party Services
          </Typography>
          <Typography variant="body1" paragraph>
            Our system may integrate with third-party services for specific
            functions such as payment processing, laboratory services, or
            insurance verification. These services have their own privacy
            policies, and we encourage you to review them.
          </Typography>
        </section>

        <section>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            className="text-secondary font-semibold"
          >
            {`   10. Children's Privacy`}
          </Typography>
          <Typography variant="body1" paragraph>
            We are committed to protecting the privacy of children. For patients
            under 18 years of age, we collect and use information in accordance
            with applicable laws and with appropriate parental or guardian
            consent.
          </Typography>
        </section>

        <section>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            className="text-secondary font-semibold"
          >
            11. International Data Transfers
          </Typography>
          <Typography variant="body1" paragraph>
            If your information is transferred to or processed in countries
            outside your residence, we ensure appropriate safeguards are in
            place to protect your privacy rights.
          </Typography>
        </section>

        <section>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            className="text-secondary font-semibold"
          >
            12. Changes to This Policy
          </Typography>
          <Typography variant="body1" paragraph>
            {`  We may update this Privacy Policy from time to time. We will notify
                        you of any material changes by posting the new policy on our system
                        and updating the "Last updated" date. Your continued use of the
                        system after such changes constitutes acceptance of the updated
                        policy.`}
          </Typography>
        </section>

        <section>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            className="text-secondary font-semibold"
          >
            13. Contact Us
          </Typography>
          <Typography variant="body1" paragraph>
            If you have any questions about this Privacy Policy or our privacy
            practices, please contact us:
          </Typography>
          <Box className="bg-gray-50 p-4 rounded-lg">
            <Typography variant="body1">
              <strong>Privacy Officer:</strong>
              <br />
              <strong>Email:</strong> originsivf@gmail.com
              <br />
              {/* <strong>Phone:</strong> +91 88868 77701<br /> */}
            </Typography>
          </Box>
        </section>

        {/* <section>
                    <Typography variant="h5" component="h2" gutterBottom className="text-secondary font-semibold">
                        14. Complaints
                    </Typography>
                    <Typography variant="body1" paragraph>
                        If you believe your privacy rights have been violated, you may file a complaint with:
                    </Typography>
                    <Box className="bg-gray-50 p-4 rounded-lg">
                        <Typography variant="body1">
                            <strong>Office for Civil Rights (OCR)</strong><br />
                            U.S. Department of Health and Human Services<br />
                            <strong>Website:</strong> www.hhs.gov/ocr/privacy/hipaa/complaints/<br />
                            <strong>Phone:</strong> 1-800-368-1019<br />
                            <strong>Email:</strong> ocrcomplaints@hhs.gov
                        </Typography>
                    </Box>
                </section> */}
      </Box>
    </Box>
  )
}

// Refund Policy Modal Content
export const RefundPolicyContent = () => {
  const dispatch = useDispatch()

  return (
    <Box className="p-6 max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <Typography
          variant="h4"
          component="h1"
          className="text-secondary font-bold"
        >
          Refund Policy
        </Typography>
        <IconButton onClick={() => dispatch(closeModal())}>
          <Close />
        </IconButton>
      </div>

      <Typography variant="body1" paragraph className="text-gray-600 mb-4">
        Last updated: {new Date().toLocaleDateString()}
      </Typography>

      <Box className="space-y-6">
        <section>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            className="text-secondary font-semibold"
          >
            1. Overview
          </Typography>
          <Typography variant="body1" paragraph>
            At Origins IVF & Fertility Center, we understand that circumstances
            may arise where you need to request a refund for services paid
            through our Hospital Management System. This policy outlines the
            terms and conditions for refunds across different service
            categories.
          </Typography>
        </section>

        <section>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            className="text-secondary font-semibold"
          >
            2. Consultation Fees
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>2.1 Cancellation Before Appointment:</strong> Full refund
            available if cancelled 24 hours or more before the scheduled
            appointment time.
          </Typography>
          {/* <Typography variant="body1" paragraph>
            <strong>2.2 Cancellation Within 24 Hours:</strong> 50% refund available if cancelled between 2-24 hours before the appointment.
          </Typography> */}
          {/* <Typography variant="body1" paragraph>
            <strong>2.2 No-Show:</strong> No refund available for missed appointments without prior notice.
          </Typography> */}
        </section>

        <section>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            className="text-secondary font-semibold"
          >
            3. Treatment Packages
          </Typography>
          {/* <Typography variant="body1" paragraph>
            <strong>3.1 Before Treatment Commencement:</strong> Full refund minus administrative charges (₹500) if cancelled before any treatment procedures begin.
          </Typography> */}
          <Typography variant="body1" paragraph>
            <strong>3.1 During Treatment:</strong> Partial refund calculated
            based on completed vs. remaining procedures, minus administrative
            and processing fees.
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>3.2 Medical Reasons:</strong> Full refund available with
            valid medical documentation from a qualified healthcare provider.
          </Typography>
        </section>

        <section>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            className="text-secondary font-semibold"
          >
            4. Laboratory Tests and Scans
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>4.1 Before Sample Collection:</strong> Full refund available
            if cancelled before sample collection or scan appointment.
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>4.2 After Sample Collection:</strong> No refund available
            once samples have been collected or scans have been performed.
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>4.3 Failed Tests:</strong> Free retest available if test
            failure is due to technical issues on our end.
          </Typography>
        </section>

        <section>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            className="text-secondary font-semibold"
          >
            5. Pharmacy Medications
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>5.1 Unopened Medications:</strong> Full refund available for
            unopened, unexpired medications returned within 7 days of purchase.
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>5.2 Opened Medications:</strong> No refund available for
            opened or partially used medications.
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>5.3 Expired Medications:</strong> Full refund available if
            medications are found to be expired at the time of purchase.
          </Typography>
        </section>

        <section>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            className="text-secondary font-semibold"
          >
            6. Refund Processing
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>6.1 Processing Time:</strong> Refunds are typically
            processed within 7-14 business days from the date of approval.
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>6.2 Payment Method:</strong> Refunds will be issued to the
            original payment method used for the transaction.
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>6.3 Bank Processing:</strong> Additional time may be
            required by your bank or payment provider to reflect the refund in
            your account.
          </Typography>
        </section>

        <section>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            className="text-secondary font-semibold"
          >
            7. Non-Refundable Services
          </Typography>
          <Typography variant="body1" paragraph>
            The following services are non-refundable:
          </Typography>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Completed consultations and medical procedures</li>
            <li>Laboratory tests where samples have been processed</li>
            <li>Scans and imaging procedures that have been performed</li>
            <li>Opened or used medications</li>
            <li>Administrative fees and processing charges</li>
            <li>Services rendered due to medical emergencies</li>
          </ul>
        </section>

        <section>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            className="text-secondary font-semibold"
          >
            8. How to Request a Refund
          </Typography>
          <Typography variant="body1" paragraph>
            To request a refund, please follow these steps:
          </Typography>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700">
            <li>
              Contact our billing department via email at originsivf@gmail.com
            </li>
            <li>
              Include your patient ID, transaction details, and reason for
              refund
            </li>
            <li>
              Provide any supporting documentation (medical certificates, etc.)
            </li>
            <li>Allow 3-5 business days for review and response</li>
          </ol>
        </section>

        <section>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            className="text-secondary font-semibold"
          >
            9. Dispute Resolution
          </Typography>
          <Typography variant="body1" paragraph>
            If you disagree with a refund decision, you may:
          </Typography>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Request a review by our management team</li>
            <li>Provide additional documentation or evidence</li>
            <li>Contact our patient relations department</li>
            <li>
              Escalate to relevant healthcare regulatory authorities if
              applicable
            </li>
          </ul>
        </section>

        <section>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            className="text-secondary font-semibold"
          >
            10. Contact Information
          </Typography>
          <Typography variant="body1" paragraph>
            For refund-related inquiries, please contact us:
          </Typography>
          <Box className="bg-gray-50 p-4 rounded-lg">
            <Typography variant="body1">
              <strong>Billing Department:</strong>
              <br />
              <strong>Email:</strong> originsivf@gmail.com
              <br />
              <strong>Phone:</strong> +91 7093082252
              <br />
              <strong>Business Hours:</strong> Monday - Friday, 9:00 AM - 6:00
              PM
            </Typography>
          </Box>
        </section>

        <section>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            className="text-secondary font-semibold"
          >
            11. Policy Updates
          </Typography>
          <Typography variant="body1" paragraph>
            We reserve the right to modify this refund policy at any time.
            Changes will be effective immediately upon posting on our system.
            Continued use of our services after policy changes constitutes
            acceptance of the updated terms.
          </Typography>
        </section>
      </Box>
    </Box>
  )
}

// Contact Modal Content
export const ContactContent = () => {
  const dispatch = useDispatch()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })

  const handleInputChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = e => {
    e.preventDefault()
    // Here you would typically send the form data to your backend
    console.log('Form submitted:', formData)
    // Reset form
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: '',
    })
    alert('Thank you for your message. We will get back to you soon!')
    dispatch(closeModal())
  }

  return (
    <Box className="p-6 max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <Typography
          variant="h4"
          component="h1"
          className="text-secondary font-bold"
        >
          Contact Us
        </Typography>
        <IconButton onClick={() => dispatch(closeModal())}>
          <Close />
        </IconButton>
      </div>

      {/* <Grid container spacing={4}> */}
      {/* Contact Information */}
      <Box className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gray-50">
            <CardContent className="flex items-start space-x-3">
              <Phone className="text-secondary mt-1" />
              <Box>
                <Typography variant="h6" className="font-semibold">
                  Phone
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  +91 7093082252
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  +91 98664 85123
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  +91 95159 56730
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Card className="bg-gray-50">
            <CardContent className="flex items-start space-x-3">
              <Email className="text-secondary mt-1" />
              <Box>
                <Typography variant="h6" className="font-semibold">
                  Email
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  originsivf@gmail.com
                </Typography>
                {/* <Typography variant="body2" className="text-gray-600">
                  support@hospital.com
                </Typography> */}
              </Box>
            </CardContent>
          </Card>

          <Card className="bg-gray-50">
            <CardContent className="flex items-start space-x-3">
              <LocationOn className="text-secondary mt-1" />
              <Box>
                <Typography variant="h6" className="font-semibold">
                  Address
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  2nd floor, MN corner, Kokapet, Hyderabad,Telangana - 500075
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Card className="bg-gray-50">
            <CardContent className="flex items-start space-x-3">
              <AccessTime className="text-secondary mt-1" />
              <Box>
                <Typography variant="h6" className="font-semibold">
                  Business Hours
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  Monday - Friday: 8:00 AM - 8:00 PM
                  <br />
                  Saturday: 9:00 AM - 6:00 PM
                  <br />
                  Sunday: 10:00 AM - 4:00 PM
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </div>
      </Box>

      {/* </Grid> */}

      {/* Emergency Contact */}
      {/* <Box className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
        <Typography
          variant="h6"
          component="h3"
          gutterBottom
          className="text-red-700 font-semibold"
        >
          Emergency Contact
        </Typography>
        <Typography variant="body1" className="text-red-600">
          For medical emergencies, please call our 24/7 emergency hotline:{' '}
          <strong>+1-234-567-9999</strong>
        </Typography>
      </Box> */}
    </Box>
  )
}
