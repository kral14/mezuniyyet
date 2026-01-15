import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { errorReporter } from '../services/errorReporter';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.group("🔥 ErrorBoundary Caught Error");
        console.error("Uncaught error:", error);
        console.info("Info:", errorInfo);

        // Report to Admin
        console.log("📨 Attempting to report error to Admin...");
        errorReporter.reportError(error, errorInfo)
            .then(() => console.log("✅ Error Report Promise Resolved"))
            .catch(err => console.error("❌ Error Report Failed in Boundary:", err))
            .finally(() => console.groupEnd());
    }

    render() {
        if (this.state.hasError) {
            return (
                <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    height="100vh"
                    p={3}
                    bgcolor="#fef2f2"
                >
                    <Typography variant="h4" color="error" gutterBottom fontWeight="bold">
                        Xəta baş verdi!
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                        Təəssüf ki, proqram gözlənilməz xəta ilə qarşılaşdı.
                    </Typography>

                    <Box
                        component="pre"
                        p={2}
                        bgcolor="grey.100"
                        borderRadius={2}
                        width="100%"
                        maxWidth="800px"
                        overflow="auto"
                        border="1px solid #e5e7eb"
                    >
                        <code>
                            {this.state.error && this.state.error.toString()}
                            <br />
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </code>
                    </Box>

                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => window.location.reload()}
                        sx={{ mt: 3 }}
                    >
                        Səhifəni Yenilə
                    </Button>
                </Box>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
