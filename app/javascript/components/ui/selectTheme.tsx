const selectTheme = (theme: any, isDark: boolean) => ({
  ...theme,
  colors: {
    ...theme.colors,
    primary: 'hsl(var(--primary))',
    primary75: 'hsla(var(--primary), 0.75)',
    primary50: 'hsla(var(--primary), 0.5)',
    primary25: 'hsla(var(--primary), 0.25)',
    danger: 'hsl(var(--destructive))',
    dangerLight: 'hsla(var(--destructive), 0.2)',
    neutral0: isDark ? 'hsl(var(--background))' : 'hsl(var(--background))',
    neutral5: isDark ? 'hsl(var(--background))' : 'hsl(var(--muted))',
    neutral10: isDark ? 'hsl(var(--muted))' : 'hsl(var(--muted))',
    neutral20: isDark ? 'hsl(var(--border))' : 'hsl(var(--border))',
    neutral30: isDark ? 'hsl(var(--border))' : 'hsl(var(--border))',
    neutral40: isDark ? 'hsl(var(--muted-foreground))' : 'hsl(var(--muted-foreground))',
    neutral50: isDark ? 'hsl(var(--muted-foreground))' : 'hsl(var(--muted-foreground))',
    neutral60: isDark ? 'hsl(var(--foreground))' : 'hsl(var(--foreground))',
    neutral70: isDark ? 'hsl(var(--foreground))' : 'hsl(var(--foreground))',
    neutral80: isDark ? 'hsl(var(--foreground))' : 'hsl(var(--foreground))',
    neutral90: isDark ? 'hsl(var(--foreground))' : 'hsl(var(--foreground))',
  },
})

const selectStyles = {
  control: (base) => ({
    ...base,
    backgroundColor: 'hsl(var(--background))',
    borderColor: 'hsl(var(--border))',
    '&:hover': {
      borderColor: 'hsl(var(--border))'
    }
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: 'hsl(var(--background))',
    borderColor: 'hsl(var(--border))'
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused ? 'hsl(var(--accent))' : 'transparent',
    color: state.isFocused ? 'hsl(var(--accent-foreground))' : 'inherit',
    '&:hover': {
      backgroundColor: 'hsl(var(--accent))',
      color: 'hsl(var(--accent-foreground))'
    }
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: 'hsl(var(--accent))',
    color: 'hsl(var(--accent-foreground))'
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: 'hsl(var(--accent-foreground))'
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: 'hsl(var(--accent-foreground))',
    '&:hover': {
      backgroundColor: 'hsl(var(--destructive))',
      color: 'hsl(var(--destructive-foreground))'
    }
  })
}

export default selectTheme
export { selectTheme, selectStyles }
