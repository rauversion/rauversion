const selectTheme = (theme, isDark) => ({
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

export default selectTheme