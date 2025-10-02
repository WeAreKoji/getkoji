import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface VerificationRejectedEmailProps {
  displayName: string;
  rejectionReason: string;
  appUrl: string;
}

export const VerificationRejectedEmail = ({
  displayName,
  rejectionReason,
  appUrl,
}: VerificationRejectedEmailProps) => (
  <Html>
    <Head />
    <Preview>Action required: Verification update needed</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Verification Requires Updates</Heading>
        <Text style={text}>Hi {displayName},</Text>
        <Text style={text}>
          Thank you for submitting your identity verification. Unfortunately, we were unable to approve your submission at this time.
        </Text>
        <Text style={reasonBox}>
          <strong>Reason:</strong><br />
          {rejectionReason}
        </Text>
        <Text style={text}>
          <strong>What you can do:</strong>
        </Text>
        <Text style={text}>
          • Review the reason above carefully<br />
          • Prepare updated documents that address the issue<br />
          • Resubmit your verification with corrected information<br />
          • Contact support if you need help
        </Text>
        <Text style={text}>
          We're here to help you succeed. Please don't hesitate to reach out if you have questions about the verification process.
        </Text>
        <Link
          href={`${appUrl}/creator/verify-identity`}
          target="_blank"
          style={button}
        >
          Resubmit Verification
        </Link>
        <Text style={footer}>
          Need assistance? Contact our support team for personalized help with your verification.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default VerificationRejectedEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const h1 = {
  color: '#ef4444',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 40px',
};

const reasonBox = {
  backgroundColor: '#fef2f2',
  border: '1px solid #fee2e2',
  borderRadius: '5px',
  color: '#991b1b',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '24px 40px',
  padding: '16px',
};

const button = {
  backgroundColor: '#ef4444',
  borderRadius: '5px',
  color: '#fff',
  display: 'block',
  fontSize: '16px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  textDecoration: 'none',
  padding: '12px 20px',
  margin: '32px 40px',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '32px 40px',
  textAlign: 'center' as const,
};
