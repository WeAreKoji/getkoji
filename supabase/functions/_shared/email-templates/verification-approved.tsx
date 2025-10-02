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

interface VerificationApprovedEmailProps {
  displayName: string;
  appUrl: string;
}

export const VerificationApprovedEmail = ({
  displayName,
  appUrl,
}: VerificationApprovedEmailProps) => (
  <Html>
    <Head />
    <Preview>Your identity has been verified! 🎉</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Verification Approved! 🎉</Heading>
        <Text style={text}>Hi {displayName},</Text>
        <Text style={text}>
          Great news! Your identity verification has been approved. You're now ready to complete your creator profile setup and start earning.
        </Text>
        <Text style={text}>
          <strong>Next steps:</strong>
        </Text>
        <Text style={text}>
          1. Set your subscription price<br />
          2. Complete your creator profile<br />
          3. Connect your payout account (Stripe)<br />
          4. Start creating content and earning
        </Text>
        <Text style={text}>
          Your verified status will be displayed on your profile, building trust with your subscribers.
        </Text>
        <Link
          href={`${appUrl}/creator/setup`}
          target="_blank"
          style={button}
        >
          Complete Setup
        </Link>
        <Text style={footer}>
          Welcome to the creator community! If you have any questions, our support team is here to help.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default VerificationApprovedEmail;

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
  color: '#22c55e',
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
  backgroundColor: '#22c55e',
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
