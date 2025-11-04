// Press Kit Templates

export const pressKitTemplates = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'A traditional press kit layout with bio, photos, and contact info',
    preview: '',
    data: {
      content: [
        {
          type: 'Section',
          props: {
            id: 'hero',
            padding: '80px 20px',
            background: '#000000',
            className: 'text-center'
          }
        },
        {
          type: 'Container',
          props: {
            id: 'hero-container',
            maxWidth: '1200px'
          }
        },
        {
          type: 'Title',
          props: {
            id: 'hero-title',
            text: 'Artist Name',
            size: 'xxl',
            color: '#ffffff',
            align: 'center'
          }
        },
        {
          type: 'Text',
          props: {
            id: 'hero-subtitle',
            text: 'DJ / Producer / Artist',
            size: 'lg',
            color: '#cccccc',
            align: 'center'
          }
        },
        {
          type: 'Section',
          props: {
            id: 'bio',
            padding: '60px 20px',
            background: '#ffffff'
          }
        },
        {
          type: 'Container',
          props: {
            id: 'bio-container',
            maxWidth: '800px'
          }
        },
        {
          type: 'Title',
          props: {
            id: 'bio-title',
            text: 'Biography',
            size: 'xl',
            align: 'left'
          }
        },
        {
          type: 'Text',
          props: {
            id: 'bio-text',
            text: 'Write your biography here...',
            size: 'base',
            align: 'left'
          }
        },
        {
          type: 'Section',
          props: {
            id: 'photos',
            padding: '60px 20px',
            background: '#f5f5f5'
          }
        },
        {
          type: 'Container',
          props: {
            id: 'photos-container',
            maxWidth: '1200px'
          }
        },
        {
          type: 'Title',
          props: {
            id: 'photos-title',
            text: 'Press Photos',
            size: 'xl',
            align: 'center'
          }
        },
        {
          type: 'Grid',
          props: {
            id: 'photos-grid',
            columns: 3,
            gap: '20px'
          }
        },
        {
          type: 'Section',
          props: {
            id: 'contact',
            padding: '60px 20px',
            background: '#000000'
          }
        },
        {
          type: 'Container',
          props: {
            id: 'contact-container',
            maxWidth: '600px'
          }
        },
        {
          type: 'Title',
          props: {
            id: 'contact-title',
            text: 'Contact',
            size: 'xl',
            color: '#ffffff',
            align: 'center'
          }
        },
        {
          type: 'Text',
          props: {
            id: 'contact-info',
            text: 'booking@artist.com',
            size: 'lg',
            color: '#ffffff',
            align: 'center'
          }
        }
      ],
      root: {
        props: {}
      }
    }
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'A sleek, modern design with bold typography and imagery',
    preview: '',
    data: {
      content: [
        {
          type: 'Section',
          props: {
            id: 'hero-modern',
            padding: '120px 20px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }
        },
        {
          type: 'Container',
          props: {
            id: 'hero-container-modern',
            maxWidth: '1200px'
          }
        },
        {
          type: 'Title',
          props: {
            id: 'hero-title-modern',
            text: 'Your Name',
            size: 'xxxl',
            color: '#ffffff',
            align: 'left',
            fontWeight: 'bold'
          }
        },
        {
          type: 'Text',
          props: {
            id: 'hero-tagline',
            text: 'Electronic Music Producer',
            size: 'xl',
            color: '#ffffff',
            align: 'left'
          }
        },
        {
          type: 'Section',
          props: {
            id: 'about-modern',
            padding: '80px 20px',
            background: '#ffffff'
          }
        },
        {
          type: 'Container',
          props: {
            id: 'about-container',
            maxWidth: '1000px'
          }
        },
        {
          type: 'Flex',
          props: {
            id: 'about-flex',
            direction: 'row',
            gap: '40px',
            align: 'start'
          }
        },
        {
          type: 'Title',
          props: {
            id: 'about-title',
            text: 'About',
            size: 'xxl'
          }
        },
        {
          type: 'Text',
          props: {
            id: 'about-text',
            text: 'Your story goes here...',
            size: 'lg'
          }
        }
      ],
      root: {
        props: {}
      }
    }
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'A clean, minimal design focusing on content',
    preview: '',
    data: {
      content: [
        {
          type: 'Section',
          props: {
            id: 'minimal-hero',
            padding: '100px 20px',
            background: '#ffffff'
          }
        },
        {
          type: 'Container',
          props: {
            id: 'minimal-container',
            maxWidth: '900px'
          }
        },
        {
          type: 'Title',
          props: {
            id: 'minimal-name',
            text: 'Artist Name',
            size: 'xxl',
            align: 'center',
            fontWeight: 'normal'
          }
        },
        {
          type: 'Section',
          props: {
            id: 'minimal-content',
            padding: '40px 20px',
            background: '#ffffff'
          }
        },
        {
          type: 'Container',
          props: {
            id: 'minimal-content-container',
            maxWidth: '700px'
          }
        },
        {
          type: 'Text',
          props: {
            id: 'minimal-bio',
            text: 'A brief biography...',
            size: 'base',
            align: 'left'
          }
        }
      ],
      root: {
        props: {}
      }
    }
  }
]

export default pressKitTemplates
