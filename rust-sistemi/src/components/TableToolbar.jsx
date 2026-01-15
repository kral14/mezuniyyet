import React from 'react';
import { Toolbar, Typography, IconButton, Tooltip, Button, Box } from '@mui/material';
import { Delete, Print, UploadFile, Add, CheckCircle, Cancel, Refresh, Edit, Archive } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';

const TableToolbar = (props) => {
    const { numSelected, title, onAdd, onDelete, onPrint, onExport, onApprove, onReject, onRefresh, onEdit, onArchive } = props;
    // Debug log for checking disabled states
    // console.log("TableToolbar Rendered. numSelected:", numSelected);
    const hasSelection = numSelected > 0;

    return (
        <Toolbar
            sx={{
                pl: { sm: 2 },
                pr: { xs: 1, sm: 1 },
                bgcolor: 'inherit',
                borderRadius: '8px 8px 0 0',
            }}
        >
            <Typography
                sx={{ flex: '1 1 100%' }}
                variant="h6"
                id="tableTitle"
                component="div"
                fontWeight="bold"
            >
                {title}
                {hasSelection && (
                    <Typography component="span" variant="body2" color="primary" sx={{ ml: 2, fontWeight: 'bold' }}>
                        ({numSelected} seçilib)
                    </Typography>
                )}
            </Typography>

            <Box display="flex" gap={1} alignItems="center">
                {onApprove && (
                    <Tooltip title={hasSelection ? "Təsdiqlə / Aktiv et" : "Seçim edin"}>
                        <span>
                            <IconButton onClick={onApprove} color="success" size="small" disabled={!hasSelection}>
                                <CheckCircle />
                            </IconButton>
                        </span>
                    </Tooltip>
                )}
                {onReject && (
                    <Tooltip title={hasSelection ? "İmtina / Deaktiv et" : "Seçim edin"}>
                        <span>
                            <IconButton onClick={onReject} color="warning" size="small" disabled={!hasSelection}>
                                <Cancel />
                            </IconButton>
                        </span>
                    </Tooltip>
                )}

                {onEdit && (
                    <Tooltip title={numSelected === 1 ? "Redaktə et" : numSelected === 0 ? "Seçim edin" : "Yalnız 1 sətir seçin"}>
                        <span>
                            <IconButton onClick={onEdit} color="primary" size="small" disabled={numSelected !== 1}>
                                <Edit />
                            </IconButton>
                        </span>
                    </Tooltip>
                )}

                {onRefresh && (
                    <Tooltip title="Yenilə">
                        <IconButton onClick={onRefresh} color="primary" size="small">
                            <Refresh />
                        </IconButton>
                    </Tooltip>
                )}

                <Tooltip title="Excell-ə çıxart">
                    <IconButton onClick={onExport} color="primary" size="small">
                        <UploadFile />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Çap et">
                    <IconButton onClick={onPrint} color="primary" size="small">
                        <Print />
                    </IconButton>
                </Tooltip>

                <Tooltip title={hasSelection ? "Sil" : "Seçim edin"}>
                    <span>
                        <IconButton onClick={onDelete} color="error" size="small" disabled={!hasSelection}>
                            <Delete />
                        </IconButton>
                    </span>
                </Tooltip>

                {onArchive && (
                    <Tooltip title={hasSelection ? "Arxivlə" : "Seçim edin"}>
                        <span>
                            <IconButton onClick={onArchive} color="secondary" size="small" disabled={!hasSelection}>
                                <Archive />
                            </IconButton>
                        </span>
                    </Tooltip>
                )}

                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={onAdd}
                    size="small"
                    sx={{ whiteSpace: 'nowrap', ml: 2 }}
                >
                    Yeni Məzuniyyət
                </Button>
            </Box>
        </Toolbar>
    );
};

export default TableToolbar;
