describe('test harness', () => {
  it('provides a DOM environment with jest-dom matchers', () => {
    const element = document.createElement('main');
    element.textContent = 'fathom';
    document.body.appendChild(element);

    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent('fathom');

    element.remove();
  });
});
