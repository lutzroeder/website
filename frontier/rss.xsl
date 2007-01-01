<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:xhtml="http://www.w3.org/1999/xhtml"> 

<xsl:template match="/">
<xsl:apply-templates select="rss"/>
</xsl:template>

<xsl:template match="rss">
<xsl:apply-templates select="channel"/>
</xsl:template>

<xsl:template match="channel">
<tr>
<td>
<xsl:apply-templates select="item"/>
</td>
</tr>
</xsl:template>

<xsl:template match="item">
<table cellpadding="0" cellspacing='0' width="470" border="0" style="border-width: 0px 0px 1px 0px; border-style: solid; border-color: #666666; padding: 0 0 2px 0; margin: 0 0 2px 0"><tr><td align="left"><b><a style="text-decoration: none;"><xsl:attribute name="href"><xsl:value-of select="link"/></xsl:attribute><xsl:value-of select="title" disable-output-escaping="yes"/></a></b></td><td align="right"><xsl:value-of select="pubDate"/></td></tr></table>
<table cellpadding="0" cellspacing='0'><tr><td><xsl:value-of disable-output-escaping="yes" select="description"/></td></tr></table>
<br/>
</xsl:template>

</xsl:stylesheet>
