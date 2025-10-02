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

interface VerificationSubmittedEmailProps {
  displayName: string;
  appUrl: string;
}

export const VerificationSubmittedEmail = ({
  displayName,
  appUrl,
}: VerificationSubmittedEmailProps) => (
  <Html>
    <Head />
    <Preview>Your identity verification has been submitted</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Verification Submitted ✓</Heading>
        <Text style={text}>Hi {displayName},</Text>
        <Text style={text}>
          Thank you for submitting your identity verification documents. We've received your submission and our team will review it shortly.
        </Text>
        <Text style={text}>
          <strong>What happens next?</strong>
        </Text>
        <Text style={text}>
          • Our verification team will review your documents within 24-48 hours<br />
          • You'll receive an email notification once the review is complete<br />
          • If approved, you can immediately start setting up your creator profile
        </Text>
        <Text style={text}>
          We take identity verification seriously to ensure a safe and trustworthy community for all users.
        </Text>
        <Link
          href={`${appUrl}/creator/verify-identity`}
          target="_blank"
          style={button}
        >
          Check Status
        </Link>
        <Text style={footer}>
          Questions? Contact our support team or visit our help center.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default VerificationSubmittedEmail;

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
  color: '#333',
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

const button = {
  backgroundColor: '#5469d4',
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
