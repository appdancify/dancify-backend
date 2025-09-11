// Get dance styles for iOS app
app.get('/api/dance-styles', async (req, res) => {
  try {
    console.log('Fetching dance styles for iOS app...');
    
    const { data: styles, error } = await supabase
      .from('dance_styles')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    // ADD MOVE COUNT CALCULATION FOR iOS - Same logic as admin endpoint
    let stylesWithCounts = styles || [];
    
    if (styles && styles.length > 0) {
      stylesWithCounts = await Promise.all(
        styles.map(async (style) => {
          try {
            // Count moves for this style - using same logic as admin endpoint
            const { count: moveCount } = await supabase
              .from('dance_moves')
              .select('*', { count: 'exact', head: true })
              .eq('dance_style', style.name)
              .eq('is_active', true);

            return {
              ...style,
              moves_count: moveCount || 0  // Add the count iOS expects
            };
          } catch (error) {
            console.error(`Error counting moves for style ${style.name}:`, error);
            return {
              ...style,
              moves_count: 0
            };
          }
        })
      );
    }

    console.log(`Found ${stylesWithCounts.length} dance styles for iOS app`);
    
    // Log move counts for debugging
    stylesWithCounts.forEach(style => {
      console.log(`Style '${style.name}' has ${style.moves_count} moves`);
    });
    
    res.json({
      success: true,
      data: stylesWithCounts,
      count: stylesWithCounts.length,
      message: `Retrieved ${stylesWithCounts.length} dance styles`
    });
  } catch (error) {
    console.error('Error fetching dance styles for iOS app:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dance styles',
      message: error.message
    });
  }
});