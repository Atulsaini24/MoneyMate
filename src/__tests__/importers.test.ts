import { describe, it, expect } from 'vitest';
import { parseSms, parseSmsBatch, splitMessages } from '@/lib/importers/sms';
import { parseStatement, parseCsv } from '@/lib/importers/statement';
import { cleanMerchant, parseBankDate, markDuplicates } from '@/lib/importers/types';
import { NOW, tx } from './fixtures';

const day = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };

describe('bank SMS', () => {
  const cases: [string, string, Partial<{ type: string; amount: number; description: string; date: string; paymentMethod: string; account: string; category: string }>][] = [
    ['SBI UPI debit',
      'Dear UPI user A/C X1234 debited by 250.00 on date 24Oct26 trf to SWIGGY Refno 429812345678. If not u? call 1800111109. -SBI',
      { type: 'expense', description: 'Swiggy', date: '2026-10-24', paymentMethod: 'UPI', account: '1234', category: 'Food & Dining' }],
    ['HDFC card spend',
      'Rs.1,499.00 spent on HDFC Bank Card x4321 at AMAZON on 2026-10-23:12:01:22. Avl Lmt: Rs.85,000.00. Not you? Call 18002586161',
      { type: 'expense', amount: 1499, description: 'Amazon', date: '2026-10-23', paymentMethod: 'Debit Card', account: '4321', category: 'Shopping' }],
    ['salary credit',
      'Your A/c XX5678 is credited with Rs 85,000.00 on 01-Oct-26 by NEFT from INFOSYS LTD. Avl Bal Rs 1,20,000.00',
      { type: 'income', amount: 85000, description: 'Infosys', date: '2026-10-01', paymentMethod: 'Net Banking' }],
    ['ICICI debit with merchant credited',
      'ICICI Bank Acct XX123 debited for Rs 649.00 on 12-Oct-26; NETFLIX credited. UPI:428812345. Call 18002662 for dispute.',
      { type: 'expense', amount: 649, description: 'Netflix', category: 'Entertainment' }],
    ['HDFC sent to person',
      'Sent Rs.500.00\nFrom HDFC Bank A/C *1234\nTo RAHUL KUMAR\nOn 20/10/26\nRef 429876543210\nNot You? Call 18002586161',
      { type: 'expense', amount: 500, description: 'Rahul Kumar', date: '2026-10-20' }],
    ['VPA handle',
      'Rs.22000.00 has been debited from account **1234 to VPA landlord.sharma@okaxis on 05-10-2026. UPI Ref 1234.',
      { type: 'expense', amount: 22000, description: 'Landlord Sharma', date: '2026-10-05', paymentMethod: 'UPI' }],
    ['ATM withdrawal',
      'Rs 2000 withdrawn at ATM from A/c XX9999 on 18-10-26. Avl bal Rs 5000',
      { type: 'expense', amount: 2000, description: 'ATM withdrawal', paymentMethod: 'Cash' }],
    ['refund',
      'Refund of Rs 799.00 from MYNTRA has been credited to your a/c XX1111 on 22-Oct-26',
      { type: 'income', amount: 799, category: 'Refund' }],
  ];

  for (const [name, sms, expected] of cases) {
    it(name, () => {
      const e = parseSms(sms, [], NOW)!;
      expect(e).not.toBeNull();
      const { date, ...rest } = expected;
      expect(e).toMatchObject(rest);
      if (date) expect(day(e.date)).toBe(date.split('-').map(Number).join('-'));
    });
  }

  it.each([
    ['OTP', 'Your OTP for transaction of Rs 500 is 123456. Do not share.'],
    ['upcoming debit', 'Rs 649 will be debited from your account on 12-Nov for Netflix mandate.'],
    ['bill reminder', 'Your credit card bill of Rs 12,000 is due on 05-Nov. Minimum due Rs 600.'],
    ['promo', 'Congratulations! You are pre-approved for a loan of Rs 5,00,000. Apply now.'],
    ['collect request', 'Rahul has requested money Rs 300 from you on UPI.'],
  ])('ignores %s messages', (_, sms) => {
    expect(parseSms(sms, [], NOW)).toBeNull();
  });

  it('does not mistake the balance for the amount', () => {
    expect(parseSms('Avl Bal Rs 50,000. Rs 120 debited from A/c XX1 to UBER on 20-10-26', [], NOW)!.amount).toBe(120);
  });

  it('learns the category from the user’s history', () => {
    const history = [tx(2026, 8, 3, 'expense', 400, 'Ramesh Kirana', 'Food & Dining')];
    expect(parseSms('Rs 350 debited from A/c XX1 to RAMESH KIRANA on 20-10-26', history, NOW)!.category).toBe('Food & Dining');
  });

  it('splits one-SMS-per-line pastes and blank-line separated pastes', () => {
    expect(splitMessages('Rs 10 debited to A on 1-10-26\nRs 20 debited to B on 2-10-26')).toHaveLength(2);
    expect(splitMessages('Sent Rs.5\nTo X\n\nRs 9 credited from Y')).toHaveLength(2);
  });

  it('reports skipped messages in a batch', () => {
    const r = parseSmsBatch('Rs 10 debited from a/c XX1 to UBER on 20-10-26\n\nYour OTP is 1234', [], NOW);
    expect(r.entries).toHaveLength(1);
    expect(r.skipped).toBe(1);
  });
});

describe('dates', () => {
  it.each([
    ['24Oct26', '2026-10-24'], ['01-Oct-26', '2026-10-1'], ['20/10/26', '2026-10-20'],
    ['05-10-2026', '2026-10-5'], ['2026-10-23:12:01', '2026-10-23'], ['3 Sep 2026', '2026-9-3'],
  ])('parses %s', (input, expected) => {
    expect(day(parseBankDate(input, NOW)!)).toBe(expected.split('-').map(Number).join('-'));
  });

  it('rejects future dates', () => {
    expect(parseBankDate('25-12-26', NOW)).toBeNull();
  });
});

describe('cleanMerchant', () => {
  it.each([
    ['swiggy@icici', 'Swiggy'],
    ['UPI/429812345678/AMAZON PAY/amazonpay@apl', 'Amazon Pay'],
    ['ZOMATO PVT LTD', 'Zomato'],
    ['paytm-98765@paytm', 'Paytm'],
  ])('%s → %s', (raw, clean) => expect(cleanMerchant(raw)).toBe(clean));
});

describe('bank statement CSV', () => {
  const hdfc = `HDFC BANK Ltd.,,,,,,
Account No : 50100012345678,,,,,,
,,,,,,
Date,Narration,Chq./Ref.No.,Value Dt,Withdrawal Amt.,Deposit Amt.,Closing Balance
01/10/26,NEFT CR-INFY0000001-INFOSYS LIMITED,N1234,01/10/26,,"85,000.00","1,20,000.00"
05/10/26,UPI-LANDLORD SHARMA-landlord@okaxis-UTIB0000-4291,4291,05/10/26,"22,000.00",,"98,000.00"
12/10/26,POS 4321XXXX NETFLIX.COM,0000,12/10/26,649.00,,"97,351.00"
18/10/26,ATM WDL-NWD-MUMBAI,0000,18/10/26,"2,000.00",,"95,351.00"
`;

  it('finds the header below account details and reads debit/credit columns', () => {
    const r = parseStatement(hdfc, [], NOW);
    expect(r.error).toBeUndefined();
    expect(r.entries).toHaveLength(4);
    expect(r.entries[0]).toMatchObject({ type: 'income', amount: 85000 });
    expect(r.entries[1]).toMatchObject({ type: 'expense', amount: 22000, paymentMethod: 'UPI' });
    expect(r.entries[2]).toMatchObject({ category: 'Entertainment', paymentMethod: 'Debit Card' });
    expect(r.entries[3]).toMatchObject({ description: 'ATM withdrawal', paymentMethod: 'Cash' });
  });

  it('handles a single signed Amount column with Dr/Cr', () => {
    const csv = 'Txn Date,Description,Amount,Dr/Cr\n03 Oct 2026,UBER INDIA,350.00,DR\n04 Oct 2026,REFUND FLIPKART,999.00,CR\n';
    const r = parseStatement(csv, [], NOW);
    expect(r.entries.map(e => [e.type, e.amount])).toEqual([['expense', 350], ['income', 999]]);
  });

  it('explains when columns cannot be found', () => {
    expect(parseStatement('foo,bar\n1,2', [], NOW).error).toMatch(/columns/);
  });

  it('parses quoted CSV cells with commas and escaped quotes', () => {
    expect(parseCsv('a,"b, c","say ""hi"""\n')).toEqual([['a', 'b, c', 'say "hi"']]);
  });
});

describe('duplicates', () => {
  it('flags entries already in the ledger on the same day', () => {
    const existing = [tx(2026, 9, 12, 'expense', 649, 'Netflix', 'Entertainment')];
    const parsed = parseSmsBatch('ICICI Bank Acct XX123 debited for Rs 649.00 on 12-Oct-26; NETFLIX credited.', [], NOW).entries;
    expect(markDuplicates(parsed, existing)[0].duplicate).toBe(true);
  });
});
