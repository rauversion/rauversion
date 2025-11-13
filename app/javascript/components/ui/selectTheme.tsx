const mix = (col: string, pct: number) => `color-mix(in oklch, ${col} ${pct}%, transparent)`;


const selectTheme = (_theme: any) => ({
  ..._theme,
  colors: {
    ..._theme.colors,
    // usa directamente tus vars (ya son oklch(...))
    primary: 'var(--primary)',
    primary75: mix('var(--primary)', 75),
    primary50: mix('var(--primary)', 50),
    primary25: mix('var(--primary)', 25),

    danger: 'var(--destructive)',
    dangerLight: mix('var(--destructive)', 20),

    // neutrales
    neutral0: 'var(--background)',
    neutral5: 'var(--muted)',
    neutral10: 'var(--muted)',
    neutral20: 'var(--border)',
    neutral30: 'var(--border)',
    neutral40: 'var(--muted-foreground)',
    neutral50: 'var(--muted-foreground)',
    neutral60: 'var(--foreground)',
    neutral70: 'var(--foreground)',
    neutral80: 'var(--foreground)',
    neutral90: 'var(--foreground)',
  },
});

const selectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    backgroundColor: 'var(--background)',
    borderColor: 'var(--border)',
    boxShadow: state.isFocused ? `0 0 0 2px var(--ring)` : base.boxShadow,
    '&:hover': { borderColor: 'var(--border)' },
  }),
  menu: (base: any) => ({
    ...base,
    backgroundColor: 'var(--background)',
    border: `1px solid var(--border)`,
  }),
  menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isFocused ? 'var(--accent)' : 'transparent',
    color: state.isFocused ? 'var(--accent-foreground)' : 'inherit',
    '&:hover': {
      backgroundColor: 'var(--accent)',
      color: 'var(--accent-foreground)',
    },
  }),
  multiValue: (base: any) => ({
    ...base,
    backgroundColor: 'var(--accent)',
    color: 'var(--accent-foreground)',
  }),
  multiValueLabel: (base: any) => ({
    ...base,
    color: 'var(--accent-foreground)',
  }),
  multiValueRemove: (base: any) => ({
    ...base,
    color: 'var(--accent-foreground)',
    '&:hover': {
      backgroundColor: 'var(--destructive)',
      color: 'var(--destructive-foreground)',
    },
  }),
};

export default selectTheme;
export { selectTheme, selectStyles };