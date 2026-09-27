import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import SegmentedTabs from './SegmentedTabs';

const CONTENT = { allergens: 'глютен, лактоза', ingredients: 'овочевий бульйон, квасоля' } as const;

function Harness() {
  const [tab, setTab] = useState<keyof typeof CONTENT>('allergens');
  return (
    <SegmentedTabs
      id="detail"
      label="інформація про страву"
      options={[
        { value: 'allergens', label: 'алергени' },
        { value: 'ingredients', label: 'склад' },
      ]}
      value={tab}
      onChange={setTab}
    >
      {CONTENT[tab]}
    </SegmentedTabs>
  );
}

describe('SegmentedTabs', () => {
  it('links the panel to the selected tab', () => {
    render(<Harness />);
    const panel = screen.getByRole('tabpanel', { name: 'алергени' });
    expect(panel).toHaveTextContent('глютен, лактоза');
    expect(screen.getByRole('tab', { name: 'алергени' })).toHaveAttribute('aria-controls', panel.id);
  });

  it('switches panel content', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('tab', { name: 'склад' }));
    expect(screen.getByRole('tabpanel', { name: 'склад' })).toHaveTextContent('овочевий бульйон');
  });
});
