// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Cards } from '../Cards';

describe('<Cards>', () => {
  it('não renderiza nada quando zerado', () => {
    const { container } = render(<Cards yellow={0} red={0} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('mostra amarelos e vermelhos quando > 0', () => {
    render(<Cards yellow={3} red={1} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('omite o vermelho quando 0', () => {
    render(<Cards yellow={2} red={0} />);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.queryByText('0')).toBeNull();
  });
});
